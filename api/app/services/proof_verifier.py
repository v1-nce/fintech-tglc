from typing import Dict, Any

class ProofVerifier:
    SCORE_THRESHOLDS = [
        (0.05, 100),
        (0.1, 75),
    ]
    
    def verify(self, proof_data: Dict[str, Any]) -> Dict[str, Any]:
        if not isinstance(proof_data, dict):
            raise ValueError("Proof data must be a dictionary")
        
        metrics = proof_data.get("metrics", {})
        if not isinstance(metrics, dict):
            raise ValueError("Metrics must be a dictionary")
        
        try:
            default_rate = float(metrics.get("default_rate", 1.0))
        except (TypeError, ValueError):
            raise ValueError("Default rate must be a number between 0 and 1")
        
        if not 0 <= default_rate <= 1:
            raise ValueError("Default rate must be between 0 and 1")
        
        score = 50  # default
        for threshold, s in self.SCORE_THRESHOLDS:
            if default_rate < threshold:
                score = s
                break
        
        reason = "Low default rate" if score >= 75 else "Moderate default rate" if score == 50 else "High default rate"
        
        return {
            "valid": score >= 50,
            "confidence_score": score,
            "default_rate": default_rate,
            "reason": reason
        }
