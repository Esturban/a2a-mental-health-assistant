import React from "react";
import type { ResourceLibraryData } from "./types";

interface ResourceLibraryProps {
  data: ResourceLibraryData;
}

export const ResourceLibrary: React.FC<ResourceLibraryProps> = ({ data }) => {
  return (
    <div className="bg-white/60 backdrop-blur-md rounded-xl p-4 my-3 border-2 border-[#DBDBE5] shadow-elevation-md animate-fade-in-up">
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">📚</span>
          <h2 className="text-xl font-semibold text-[#010507]">Supportive resources</h2>
        </div>
        <p className="text-[#57575B] text-xs">{data.overview}</p>
      </div>

      <div className="space-y-3">
        {data.categories.map((category, index) => (
          <div
            key={index}
            className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-elevation-sm border border-[#E9E9EF]"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold text-[#010507]">{category.focusArea}</h3>
                <p className="text-[11px] text-[#57575B]">{category.description}</p>
              </div>
            </div>

            <div className="space-y-2">
              {category.resources.map((resource, idx) => (
                <a
                  key={idx}
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block border border-[#DBDBE5] rounded-lg p-2 bg-white/70 hover:border-[#BEC2FF] transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-semibold text-[#010507]">{resource.title}</div>
                    <span className="text-[10px] text-[#57575B] uppercase tracking-wide">
                      {resource.type} • {resource.format}
                    </span>
                  </div>
                  <p className="text-xs text-[#57575B]">{resource.description}</p>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
