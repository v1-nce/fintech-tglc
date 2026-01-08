import { LargeNumberLike } from "crypto";


export interface Loan {
    id: number;
    loanAmount: number;
    interestRate: number;
    destination: string;
    loanTerm : string;
    collateralRequired : number;
    collateralPercentage : number;
    minCreditScore : number;
}

