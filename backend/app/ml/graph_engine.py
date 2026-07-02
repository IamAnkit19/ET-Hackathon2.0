import networkx as nx
from networkx.algorithms.community import louvain_communities
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any

class GraphEngine:
    def __init__(self, transactions: List[Dict[str, Any]], accounts: List[Dict[str, Any]]):
        self.transactions = transactions
        self.accounts = {a["account_id"]: a for a in accounts}
        self.G = self._build_graph()

    def _build_graph(self) -> nx.DiGraph:
        G = nx.DiGraph()
        
        # Add account nodes with features
        for acct_id, meta in self.accounts.items():
            G.add_node(
                acct_id,
                owner_name=meta.get("owner_name", ""),
                phone_number=meta.get("phone_number", ""),
                ip=meta.get("registration_ip", ""),
                registered_risk=meta.get("risk_score", 0.0)
            )
            
        # Add transaction edges
        for tx in self.transactions:
            src = tx.get("source_account")
            dst = tx.get("target_account")
            amount = tx.get("amount", 0.0)
            
            if not G.has_node(src):
                G.add_node(src, registered_risk=0.0)
            if not G.has_node(dst):
                G.add_node(dst, registered_risk=0.0)
                
            if G.has_edge(src, dst):
                G[src][dst]["weight"] += amount
                G[src][dst]["count"] += 1
            else:
                G.add_edge(src, dst, weight=amount, count=1, timestamp=tx.get("timestamp"))
                
        return G

    def get_network_graph(self) -> Dict[str, Any]:
        """
        Returns full node/edge list with risk, centrality, and community scores.
        """
        if len(self.G.nodes) == 0:
            return {"nodes": [], "edges": []}
            
        # 1. Centrality metrics
        try:
            pagerank = nx.pagerank(self.G, weight="weight")
        except Exception:
            pagerank = {n: 0.0 for n in self.G.nodes}
            
        try:
            in_degree = dict(self.G.in_degree())
            out_degree = dict(self.G.out_degree())
        except Exception:
            in_degree = {n: 0 for n in self.G.nodes}
            out_degree = {n: 0 for n in self.G.nodes}
            
        # 2. Louvain Communities (undirected version for detection)
        undirected_G = self.G.to_undirected()
        try:
            communities_list = louvain_communities(undirected_G, weight="weight")
            # Map node to community ID
            node_communities = {}
            for cid, comm in enumerate(communities_list):
                for node in comm:
                    node_communities[node] = cid + 1
        except Exception:
            # Fallback simple connected components
            components = list(nx.connected_components(undirected_G))
            node_communities = {}
            for cid, comp in enumerate(components):
                for node in comp:
                    node_communities[node] = cid + 1

        # 3. Calculate topological fraud signatures per community
        community_tda = self.compute_topological_signatures(node_communities)
        
        # Prepare Node List
        nodes_res = []
        for node in self.G.nodes:
            pr = pagerank.get(node, 0.0)
            in_deg = in_degree.get(node, 0)
            out_deg = out_degree.get(node, 0)
            comm_id = node_communities.get(node, 0)
            tda_stats = community_tda.get(comm_id, {"betti_0": 1, "betti_1": 0})
            
            # GNN Risk Scoring simulation (ensemble)
            meta = self.accounts.get(node, {})
            base_risk = meta.get("risk_score", 0.0) if meta else 0.0
            
            # High in-degree and circular behavior increases risk
            centrality_multiplier = min(1.0, pr * 10.0 + (in_deg + out_deg) / 10.0)
            tda_risk_factor = min(1.0, tda_stats["betti_1"] / 5.0)
            
            calculated_risk = base_risk
            if calculated_risk == 0.0:
                calculated_risk = (centrality_multiplier * 50.0) + (tda_risk_factor * 50.0)
                calculated_risk = max(5.0, min(99.0, calculated_risk))
                
            status = "SAFE"
            if calculated_risk > 75:
                status = "MULE"
            elif calculated_risk > 45:
                status = "SUSPICIOUS"
                
            nodes_res.append({
                "id": node,
                "label": meta.get("owner_name", f"Acc-{node[-4:]}"),
                "phone": meta.get("phone_number", ""),
                "ip": meta.get("registration_ip", ""),
                "risk_score": round(calculated_risk, 1),
                "pagerank": round(pr, 4),
                "in_degree": in_deg,
                "out_degree": out_deg,
                "community_id": comm_id,
                "betti_0": tda_stats["betti_0"],
                "betti_1": tda_stats["betti_1"],
                "status": status
            })
            
        # Prepare Edge List
        edges_res = []
        for u, v, data in self.G.edges(data=True):
            edges_res.append({
                "source": u,
                "target": v,
                "weight": float(data.get("weight", 0.0)),
                "count": data.get("count", 1)
            })
            
        return {"nodes": nodes_res, "edges": edges_res}

    def compute_topological_signatures(self, node_communities: Dict[str, int]) -> Dict[int, Dict[str, int]]:
        """
        Applies Topological Data Analysis (TDA) concepts:
        Betti-0: Number of connected components in the community subgraph.
        Betti-1: Dimension of first homology group (number of independent circular loops).
        Calculated using: Betti_1 = Edges - Nodes + Betti_0.
        """
        signatures = {}
        communities_nodes = {}
        for node, comm_id in node_communities.items():
            communities_nodes.setdefault(comm_id, []).append(node)
            
        for comm_id, nodes in communities_nodes.items():
            subG = self.G.subgraph(nodes)
            undirected_subG = subG.to_undirected()
            
            # Betti-0 is the number of connected components
            betti_0 = nx.number_connected_components(undirected_subG)
            
            # Betti-1 is the number of cycles (dimension of cycle space)
            n_nodes = len(subG.nodes)
            n_edges = len(subG.edges)
            
            # Euler characteristic formula: Betti_0 - Betti_1 = Nodes - Edges
            # => Betti_1 = Edges - Nodes + Betti_0
            betti_1 = max(0, n_edges - n_nodes + betti_0)
            
            signatures[comm_id] = {
                "betti_0": betti_0,
                "betti_1": betti_1
            }
            
        return signatures

    def get_detected_rings(self) -> List[Dict[str, Any]]:
        """
        Identifies high-risk communities (mule rings) by checking TDA indicators,
        community size, and average risk score.
        """
        network = self.get_network_graph()
        nodes = network["nodes"]
        edges = network["edges"]
        
        # Group nodes by community
        comms = {}
        for n in nodes:
            cid = n["community_id"]
            comms.setdefault(cid, []).append(n)
            
        rings = []
        for cid, member_nodes in comms.items():
            if cid == 0 or len(member_nodes) < 3:
                continue # Skip safe/small components
                
            avg_risk = np.mean([n["risk_score"] for n in member_nodes])
            betti_1_list = [n["betti_1"] for n in member_nodes]
            max_betti_1 = max(betti_1_list) if betti_1_list else 0
            
            # Check if this qualifies as a mule ring
            if avg_risk > 50.0 or max_betti_1 > 0:
                # Calculate aggregate transaction value in this ring
                ring_accts = {n["id"] for n in member_nodes}
                ring_value = sum(
                    e["weight"] for e in edges 
                    if e["source"] in ring_accts and e["target"] in ring_accts
                )
                
                rings.append({
                    "ring_id": cid,
                    "member_count": len(member_nodes),
                    "avg_risk": round(float(avg_risk), 1),
                    "max_pagerank": round(float(max(n["pagerank"] for n in member_nodes)), 4),
                    "betti_1_cycles": max_betti_1,
                    "estimated_fraud_value": float(ring_value),
                    "status": "CRITICAL" if avg_risk > 75 else "SUSPICIOUS",
                    "members": member_nodes
                })
                
        return sorted(rings, key=lambda x: x["avg_risk"], reverse=True)
