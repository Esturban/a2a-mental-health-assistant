import React from "react";
import { CostEstimateData } from "../types";

interface CostApprovalCardProps {
  costEstimate: CostEstimateData;
  isApproved: boolean;
  isRejected: boolean;
  onApprove: () => void;
  onReject: () => void;
}

export const CostApprovalCard: React.FC<CostApprovalCardProps> = ({
  costEstimate,
  isApproved,
  isRejected,
  onApprove,
  onReject,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: costEstimate.currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-[#E4D4F4]/30 backdrop-blur-md border-2 border-[#BEC2FF] rounded-lg p-4 my-3 shadow-elevation-md">
      <div className="flex items-center gap-2 mb-3">
        <div className="text-2xl">💸</div>
        <div>
          <h3 className="text-base font-semibold text-[#010507]">Confirm estimated investment</h3>
          <p className="text-xs text-[#57575B]">
            Please confirm the pricing details before we continue scheduling.
          </p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 mb-3 border border-[#DBDBE5] shadow-elevation-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[#57575B] font-medium text-sm">Estimated monthly cost</span>
          <span className="text-2xl font-bold text-[#010507]">
            {formatCurrency(costEstimate.estimatedMonthlyCost)}
          </span>
        </div>

        <p className="text-xs text-[#57575B] bg-[#F7F7F9] rounded p-2 border border-[#DBDBE5] mb-2">
          {costEstimate.coverageSummary}
        </p>

        <div className="space-y-1.5">
          {costEstimate.breakdown?.map((item, idx) => (
            <div key={idx} className="flex items-start justify-between text-xs gap-2">
              <div className="flex-1">
                <span className="text-[#57575B] font-medium">{item.category}</span>
                <div className="text-[10px] text-[#838389] mt-0.5">{item.notes}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-[#010507]">
                  {formatCurrency(item.amount)}
                </div>
                <div
                  className={`text-[10px] font-semibold ${
                    item.covered ? "text-[#1B936F]" : "text-[#FFAC4D]"
                  }`}
                >
                  {item.covered ? "Covered" : "Out of pocket"}
                </div>
              </div>
            </div>
          ))}
        </div>

        {costEstimate.paymentConsiderations &&
          costEstimate.paymentConsiderations.length > 0 && (
            <div className="mt-2 pt-2 border-t border-[#E9E9EF] space-y-1">
              {costEstimate.paymentConsiderations.map((item, index) => (
                <div key={index} className="text-xs text-[#57575B]">
                  • {item}
                </div>
              ))}
            </div>
          )}
      </div>

      {isRejected && (
        <div className="bg-[#FFAC4D]/20 border border-[#FFAC4D] rounded-lg p-2.5 mb-3">
          <div className="flex items-center gap-2 text-[#010507]">
            <span className="text-base">❌</span>
            <div>
              <p className="font-semibold text-xs">Cost estimate declined</p>
              <p className="text-xs text-[#57575B]">
                The coordinating agent will offer an updated pricing approach.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onApprove}
          disabled={isApproved || isRejected}
          className={`flex-1 text-xs font-semibold py-2.5 px-3 rounded-lg transition-all shadow-elevation-sm ${
            isApproved
              ? "bg-[#1B936F] text-white cursor-not-allowed"
              : isRejected
              ? "bg-[#838389] text-white cursor-not-allowed"
              : "bg-[#1B936F] hover:bg-[#189370] text-white"
          }`}
        >
          {isApproved ? "✓ Confirmed" : "Approve"}
        </button>
        <button
          onClick={onReject}
          disabled={isApproved || isRejected}
          className={`flex-1 text-xs font-semibold py-2.5 px-3 rounded-lg transition-all shadow-elevation-sm ${
            isRejected
              ? "bg-[#FFAC4D] text-white cursor-not-allowed"
              : "bg-[#FFAC4D] hover:bg-[#FF9E3D] text-white"
          }`}
        >
          {isRejected ? "✗ Rejected" : "Request changes"}
        </button>
      </div>
    </div>
  );
};
