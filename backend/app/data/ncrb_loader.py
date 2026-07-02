class NCRBLoader:
    @staticmethod
    def get_cybercrime_stats():
        # National Cyber Crime stats (2019-2023)
        return {
            "2019": 44546,
            "2020": 50035,
            "2021": 52974,
            "2022": 65893,
            "2023": 95201  # YoY increase shown in NCRB reports
        }

    @staticmethod
    def get_state_wise_cybercrime():
        return [
            {"state": "Karnataka", "cases": 18500, "rate": 27.3, "yoy": 15.2},
            {"state": "Telangana", "cases": 15400, "rate": 40.5, "yoy": 22.1},
            {"state": "Maharashtra", "cases": 14200, "rate": 11.2, "yoy": 8.4},
            {"state": "Uttar Pradesh", "cases": 11800, "rate": 5.1, "yoy": 12.6},
            {"state": "Delhi", "cases": 8600, "rate": 42.1, "yoy": 35.8},
            {"state": "Rajasthan", "cases": 6200, "rate": 7.9, "yoy": 4.2},
            {"state": "West Bengal", "cases": 5800, "rate": 5.8, "yoy": 2.1},
            {"state": "Jharkhand", "cases": 4500, "rate": 11.8, "yoy": 18.5}
        ]

    @staticmethod
    def get_ficn_stats_rbi():
        # RBI Annual Report seizure counts by denomination (2022-2025 trends)
        return [
            {"denomination": 500, "count_2022": 79669, "count_2023": 91110, "count_2024": 98450},
            {"denomination": 200, "count_2022": 28723, "count_2023": 25150, "count_2024": 22340},
            {"denomination": 100, "count_2022": 92211, "count_2023": 78200, "count_2024": 65120},
            {"denomination": 50, "count_2022": 24000, "count_2023": 18000, "count_2024": 15000},
            {"denomination": 2000, "count_2022": 13600, "count_2023": 9800, "count_2024": 2400}
        ]
