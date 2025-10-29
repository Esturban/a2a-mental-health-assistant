import React from "react";
import type { AvailabilityData } from "./types";

interface AvailabilityCardProps {
  data: AvailabilityData;
}

const formatSlots = (slots: string[]) => {
  if (!slots.length) return "Join waitlist";
  return slots.join(" • ");
};

export const AvailabilityCard: React.FC<AvailabilityCardProps> = ({ data }) => {
  return (
    <div className="bg-white/60 backdrop-blur-md rounded-xl p-4 my-3 border-2 border-[#DBDBE5] shadow-elevation-md animate-fade-in-up">
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">📅</span>
          <h2 className="text-xl font-semibold text-[#010507]">{data.therapistName}</h2>
        </div>
        <p className="text-[#57575B] text-xs">
          {data.credentials} • Focus on {data.primaryFocus} • Modalities: {data.modalities.join(", ")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
        {data.availability.map((day, index) => (
          <div
            key={index}
            className="bg-white/80 backdrop-blur-sm rounded-lg p-2 shadow-elevation-sm border border-[#E9E9EF]"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#85E0CE] text-white font-bold text-[10px]">
                  {day.day}
                </div>
                <span className="text-[10px] font-semibold text-[#57575B]">{day.date}</span>
              </div>
              <span className="text-xs font-semibold text-[#1B936F]">
                {day.isVirtual ? "Virtual" : "In person"}
              </span>
            </div>

            <div className="text-[11px] text-[#010507] font-semibold mb-1">{formatSlots(day.slots)}</div>
            <p className="text-[10px] text-[#57575B]">{data.bookingNotes}</p>
          </div>
        ))}
      </div>

      {data.telehealthOptions.length > 0 && (
        <div className="bg-[#F3F3FC] border border-[#BEC2FF] rounded-lg p-3">
          <h3 className="text-sm font-semibold text-[#010507] mb-1 flex items-center gap-1">
            <span>🛰️</span>
            Telehealth support
          </h3>
          <ul className="text-xs text-[#57575B] space-y-1 pl-4 list-disc">
            {data.telehealthOptions.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
