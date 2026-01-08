class RiskModel:
    def evaluate(self, credentials: dict) -> dict:
        """
        Generate risk metrics from business credentials.

        credentials: dict containing cashflow or other info

        Returns a dict of metrics, e.g., default_rate, volatility, cash_shortfall
        """
        # Step 1: Estimate cash gap if cashflow exists
        cashflow = credentials.get("cashflow", {"expected_inflows": [], "expected_outflows": []})
        inflow = sum(cashflow.get("expected_inflows", []))
        outflow = sum(cashflow.get("expected_outflows", []))
        cash_shortfall = max(0, outflow - inflow)

        # Step 2: Fixed PoC metrics
        default_rate = 0.004
        volatility = 0.12

        # Step 3: Return all metrics as a dictionary
        return {
            "default_rate": default_rate,
            "volatility": volatility,
            "cash_shortfall": cash_shortfall
        }
