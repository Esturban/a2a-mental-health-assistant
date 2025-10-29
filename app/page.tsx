"use client";

import { useState } from "react";
import TherapyChat from "@/components/therapy-chat";
import { CarePlanCard } from "@/components/CarePlanCard";
import { AvailabilityCard } from "@/components/AvailabilityCard";
import { CostBreakdownCard } from "@/components/CostBreakdownCard";
import { ResourceLibrary } from "@/components/ResourceLibrary";
import type {
  CarePlanData,
  AvailabilityData,
  CostEstimateData,
  ResourceLibraryData,
} from "@/components/types";

export default function Home() {
  const [carePlan, setCarePlan] = useState<CarePlanData | null>(null);
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [costEstimate, setCostEstimate] = useState<CostEstimateData | null>(null);
  const [resources, setResources] = useState<ResourceLibraryData | null>(null);

  const hasContent = carePlan || availability || costEstimate || resources;

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#DEDEE9] p-2">
      <div
        className="absolute w-[445.84px] h-[445.84px] left-[1040px] top-[11px] rounded-full z-0"
        style={{ background: "rgba(255, 172, 77, 0.2)", filter: "blur(103.196px)" }}
      />
      <div
        className="absolute w-[609.35px] h-[609.35px] left-[1338.97px] top-[624.5px] rounded-full z-0"
        style={{ background: "#C9C9DA", filter: "blur(103.196px)" }}
      />
      <div
        className="absolute w-[609.35px] h-[609.35px] left-[670px] top-[-365px] rounded-full z-0"
        style={{ background: "#C9C9DA", filter: "blur(103.196px)" }}
      />
      <div
        className="absolute w-[609.35px] h-[609.35px] left-[507.87px] top-[702.14px] rounded-full z-0"
        style={{ background: "#F3F3FC", filter: "blur(103.196px)" }}
      />
      <div
        className="absolute w-[445.84px] h-[445.84px] left-[127.91px] top-[331px] rounded-full z-0"
        style={{ background: "rgba(255, 243, 136, 0.3)", filter: "blur(103.196px)" }}
      />
      <div
        className="absolute w-[445.84px] h-[445.84px] left-[-205px] top-[802.72px] rounded-full z-0"
        style={{ background: "rgba(255, 172, 77, 0.2)", filter: "blur(103.196px)" }}
      />

      <div className="flex flex-1 overflow-hidden z-10 gap-2">
        <div className="w-[450px] flex-shrink-0 border-2 border-white bg-white/50 backdrop-blur-md shadow-elevation-lg flex flex-col rounded-lg overflow-hidden">
          <div className="p-6 border-b border-[#DBDBE5]">
            <h1 className="text-2xl font-semibold text-[#010507] mb-1">Therapy Coordination Studio</h1>
            <p className="text-sm text-[#57575B] leading-relaxed">
              Multi-agent collaboration for intake, therapist availability, care planning, and cost clarity.
            </p>
            <p className="text-xs text-[#838389] mt-1">Orchestrated A2A Protocol • HITL approvals</p>
          </div>

          <div className="flex-1 overflow-hidden">
            <TherapyChat
              onCarePlanUpdate={setCarePlan}
              onAvailabilityUpdate={setAvailability}
              onCostUpdate={setCostEstimate}
              onResourcesUpdate={setResources}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto rounded-lg bg-white/30 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-semibold text-[#010507] mb-2">Personalized care workspace</h2>
              <p className="text-[#57575B]">
                Watch your care coordinator collaborate with four specialized agents to design a plan, surface therapist options,
                and confirm logistics.
              </p>
            </div>

            {!hasContent && (
              <div className="flex items-center justify-center h-[400px] bg-white/60 backdrop-blur-md rounded-xl border-2 border-dashed border-[#DBDBE5] shadow-elevation-sm">
                <div className="text-center">
                  <div className="text-6xl mb-4">🪴</div>
                  <h3 className="text-xl font-semibold text-[#010507] mb-2">Let's design the right support</h3>
                  <p className="text-[#57575B] max-w-md">
                    Share who you're supporting and the coordinator will gather intake details, explore therapist schedules, and build a
                    care roadmap tailored to your needs.
                  </p>
                </div>
              </div>
            )}

            {carePlan && (
              <div className="mb-4">
                <CarePlanCard data={carePlan} />
              </div>
            )}

            {(availability || costEstimate) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {availability && (
                  <div>
                    <AvailabilityCard data={availability} />
                  </div>
                )}

                {costEstimate && (
                  <div>
                    <CostBreakdownCard data={costEstimate} />
                  </div>
                )}
              </div>
            )}

            {resources && (
              <div className="mt-4">
                <ResourceLibrary data={resources} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
