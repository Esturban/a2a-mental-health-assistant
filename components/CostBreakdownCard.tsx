import React from "react";
import type { CostEstimateData } from "./types";

interface CostBreakdownCardProps {
  data: CostEstimateData;
}

export const CostBreakdownCard: React.FC<CostBreakdownCardProps> = ({ data }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: data.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryColor = (index: number) => {
    const colors = [
      { bg: "#85E0CE", light: "rgba(133, 224, 206, 0.1)", text: "#010507" },
      { bg: "#BEC2FF", light: "rgba(190, 194, 255, 0.1)", text: "#010507" },
      { bg: "#FFF388", light: "rgba(255, 243, 136, 0.1)", text: "#010507" },
      { bg: "#FFAC4D", light: "rgba(255, 172, 77, 0.1)", text: "#010507" },
      { bg: "#F3F3FC", light: "rgba(243, 243, 252, 0.1)", text: "#010507" },
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-xl p-4 my-3 border-2 border-[#DBDBE5] shadow-elevation-md animate-fade-in-up">
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">💡</span>
            <h2 className="text-xl font-semibold text-[#010507]">Financial overview</h2>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#010507]">
              {formatCurrency(data.estimatedMonthlyCost)}
            </div>
            <div className="text-xs text-[#57575B]">per month</div>
          </div>
        </div>
        <p className="text-xs text-[#57575B] bg-[#F7F7F9] rounded p-2 border border-[#DBDBE5]">
          {data.coverageSummary}
        </p>
      </div>

      <div className="space-y-2">
        {data.breakdown.map((item, index) => {
          const colors = getCategoryColor(index);
          return (
            <div
              key={index}
              className="bg-white/80 backdrop-blur-sm rounded-lg p-2 shadow-elevation-sm border border-[#E9E9EF]"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: colors.bg }}
                  ></div>
                  <span className="text-sm font-semibold text-[#010507]">{item.category}</span>
                  <span className={`text-[10px] font-semibold ${item.covered ? "text-[#1B936F]" : "text-[#FFAC4D]"}`}>
                    {item.covered ? "Covered" : "Client pay"}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-[#010507]">{formatCurrency(item.amount)}</div>
                </div>
              </div>
              <p className="text-[10px] text-[#57575B]">{item.notes}</p>
            </div>
          );
        })}
      </div>

      {data.paymentConsiderations.length > 0 && (
        <div className="mt-3 bg-[#85E0CE]/20 border border-[#85E0CE] rounded-lg p-3">
          <h3 className="text-xs font-semibold text-[#010507] uppercase tracking-wide mb-1">
            Next steps
          </h3>
          <ul className="text-xs text-[#57575B] space-y-1 pl-4 list-disc">
            {data.paymentConsiderations.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
