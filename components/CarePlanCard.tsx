import React from "react";
import type { CarePlanData } from "./types";

interface CarePlanCardProps {
  data: CarePlanData;
}

const SessionBadge = ({ label }: { label: string }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#85E0CE]/20 text-[#1B936F] border border-[#85E0CE]">
    {label}
  </span>
);

export const CarePlanCard: React.FC<CarePlanCardProps> = ({ data }) => {
  return (
    <div className="bg-white/60 backdrop-blur-md rounded-xl p-4 my-3 border-2 border-[#DBDBE5] shadow-elevation-md animate-fade-in-up h-[520px] flex flex-col">
      <div className="mb-3 flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🧠</span>
          <h2 className="text-xl font-semibold text-[#010507]">
            Care plan for {data.clientName || "client"}
          </h2>
        </div>
        <p className="text-[#57575B] text-xs">
          {data.durationWeeks} week support roadmap • Focus on {data.focusAreas.join(", ")}
        </p>
      </div>

      <div className="space-y-3 overflow-y-auto flex-1 pr-1">
        {data.plan.map((week) => (
          <div
            key={week.week}
            className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-elevation-sm border border-[#E9E9EF]"
          >
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#DBDBE5]">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#BEC2FF] text-white font-bold text-sm">
                {week.week}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[#010507]">{week.theme}</h3>
                <p className="text-[11px] text-[#57575B]">Primary modality: {week.primarySession.modality}</p>
              </div>
              <SessionBadge label={week.primarySession.facilitatorProfile} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              <div className="space-y-2">
                <div>
                  <h4 className="flex items-center gap-1 text-sm font-semibold text-[#010507]">
                    <span>📋</span>
                    Session focus
                  </h4>
                  <p className="text-xs text-[#57575B] bg-[#F7F7F9] rounded p-2 border border-[#DBDBE5]">
                    {week.primarySession.focus}
                  </p>
                </div>

                <div>
                  <h4 className="flex items-center gap-1 text-sm font-semibold text-[#010507]">
                    <span>🎯</span>
                    Key objectives
                  </h4>
                  <ul className="text-xs text-[#57575B] space-y-1 pl-4 list-disc">
                    {week.primarySession.keyObjectives.map((goal, idx) => (
                      <li key={idx}>{goal}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <h4 className="flex items-center gap-1 text-sm font-semibold text-[#010507]">
                    <span>🤝</span>
                    Between-session support
                  </h4>
                  <ul className="text-xs text-[#57575B] space-y-1 pl-4 list-disc">
                    {week.primarySession.betweenSessionSupport.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="flex items-center gap-1 text-sm font-semibold text-[#010507]">
                    <span>🌱</span>
                    Complementary care
                  </h4>
                  <p className="text-xs text-[#57575B] bg-[#F7F7F9] rounded p-2 border border-[#DBDBE5]">
                    {week.complementarySupport}
                  </p>
                </div>

                {week.notes && (
                  <div>
                    <h4 className="flex items-center gap-1 text-sm font-semibold text-[#010507]">
                      <span>📝</span>
                      Notes for therapist
                    </h4>
                    <p className="text-xs text-[#57575B] bg-[#F3F3FC] rounded p-2 border border-[#DBDBE5]">
                      {week.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {(data.followUpRecommendations.length > 0 || data.safetyConsiderations.length > 0) && (
        <div className="mt-3 bg-[#85E0CE]/20 border border-[#85E0CE] rounded-lg p-3">
          {data.followUpRecommendations.length > 0 && (
            <div className="mb-2">
              <h4 className="text-xs font-semibold text-[#010507] uppercase tracking-wide">Follow-up suggestions</h4>
              <ul className="text-xs text-[#57575B] space-y-1 pl-4 list-disc">
                {data.followUpRecommendations.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {data.safetyConsiderations.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-[#010507] uppercase tracking-wide">Safety & access notes</h4>
              <ul className="text-xs text-[#57575B] space-y-1 pl-4 list-disc">
                {data.safetyConsiderations.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
