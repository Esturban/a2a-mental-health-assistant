import React, { useState, useEffect } from "react";

interface ClientIntakeFormProps {
  args: any;
  respond: any;
}

export const ClientIntakeForm: React.FC<ClientIntakeFormProps> = ({ args, respond }) => {
  let parsedArgs = args;
  if (typeof args === "string") {
    try {
      parsedArgs = JSON.parse(args);
    } catch (error) {
      parsedArgs = {};
    }
  }

  const [clientName, setClientName] = useState("");
  const [primaryConcern, setPrimaryConcern] = useState("");
  const [therapyGoals, setTherapyGoals] = useState("");
  const [preferredFormat, setPreferredFormat] = useState("virtual");
  const [availability, setAvailability] = useState("");
  const [insurance, setInsurance] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!parsedArgs || typeof parsedArgs !== "object") return;
    if (parsedArgs.clientName && parsedArgs.clientName !== clientName) {
      setClientName(parsedArgs.clientName);
    }
    if (parsedArgs.primaryConcern && parsedArgs.primaryConcern !== primaryConcern) {
      setPrimaryConcern(parsedArgs.primaryConcern);
    }
    if (parsedArgs.therapyGoals && parsedArgs.therapyGoals !== therapyGoals) {
      setTherapyGoals(parsedArgs.therapyGoals);
    }
    if (parsedArgs.preferredFormat && parsedArgs.preferredFormat !== preferredFormat) {
      setPreferredFormat(parsedArgs.preferredFormat);
    }
    if (parsedArgs.availability && parsedArgs.availability !== availability) {
      setAvailability(parsedArgs.availability);
    }
    if (parsedArgs.insurance && parsedArgs.insurance !== insurance) {
      setInsurance(parsedArgs.insurance);
    }
    if (parsedArgs.notes && parsedArgs.notes !== notes) {
      setNotes(parsedArgs.notes);
    }
  }, [parsedArgs, clientName, primaryConcern, therapyGoals, preferredFormat, availability, insurance, notes]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!clientName.trim()) {
      newErrors.clientName = "Please share the client's preferred name";
    }
    if (!primaryConcern.trim()) {
      newErrors.primaryConcern = "Let us know the primary reason for seeking care";
    }
    return newErrors;
  };

  const handleSubmit = () => {
    const validation = validateForm();
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      return;
    }

    setSubmitted(true);
    respond?.({
      clientName: clientName.trim(),
      primaryConcern: primaryConcern.trim(),
      therapyGoals: therapyGoals.trim(),
      preferredFormat,
      availability: availability.trim(),
      insurance: insurance.trim(),
      notes: notes.trim(),
    });
  };

  if (submitted) {
    return (
      <div className="bg-[#85E0CE]/30 backdrop-blur-md border-2 border-[#85E0CE] rounded-lg p-4 my-3 shadow-elevation-md">
        <div className="flex items-center gap-2">
          <div className="text-2xl">✓</div>
          <div>
            <h3 className="text-base font-semibold text-[#010507]">Intake details received</h3>
            <p className="text-xs text-[#57575B]">
              Gathering therapist options and care recommendations for {clientName || "your client"}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#BEC2FF]/30 backdrop-blur-md border-2 border-[#BEC2FF] rounded-lg p-4 my-3 shadow-elevation-md">
      <div className="flex items-center gap-2 mb-4">
        <div className="text-2xl">🧠</div>
        <div>
          <h3 className="text-base font-semibold text-[#010507]">Client Intake Snapshot</h3>
          <p className="text-xs text-[#57575B]">Share a bit about who we're supporting</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-[#010507] mb-1.5">Preferred name *</label>
          <input
            type="text"
            value={clientName}
            onChange={(event) => setClientName(event.target.value)}
            placeholder="e.g., Jordan, they/them"
            className={`w-full px-3 py-2 text-sm rounded-lg border-2 transition-colors ${
              errors.clientName
                ? "border-[#FFAC4D] bg-[#FFAC4D]/10"
                : "border-[#DBDBE5] bg-white/80 backdrop-blur-sm focus:border-[#BEC2FF] focus:outline-none"
            }`}
          />
          {errors.clientName && (
            <p className="text-xs text-[#FFAC4D] mt-1">{errors.clientName}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-[#010507] mb-1.5">Primary concern *</label>
          <textarea
            value={primaryConcern}
            onChange={(event) => setPrimaryConcern(event.target.value)}
            placeholder="What feels most urgent or heavy right now?"
            rows={3}
            className={`w-full px-3 py-2 text-sm rounded-lg border-2 transition-colors resize-none ${
              errors.primaryConcern
                ? "border-[#FFAC4D] bg-[#FFAC4D]/10"
                : "border-[#DBDBE5] bg-white/80 backdrop-blur-sm focus:border-[#BEC2FF] focus:outline-none"
            }`}
          />
          {errors.primaryConcern && (
            <p className="text-xs text-[#FFAC4D] mt-1">{errors.primaryConcern}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-[#010507] mb-1.5">Therapy goals</label>
          <textarea
            value={therapyGoals}
            onChange={(event) => setTherapyGoals(event.target.value)}
            placeholder="Support with anxiety, trauma processing, boundary setting..."
            rows={2}
            className="w-full px-3 py-2 text-sm rounded-lg border-2 border-[#DBDBE5] bg-white/80 backdrop-blur-sm focus:border-[#BEC2FF] focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#010507] mb-1.5">Session format</label>
          <div className="grid grid-cols-3 gap-2">
            {["virtual", "in-person", "hybrid"].map((format) => (
              <button
                key={format}
                onClick={() => setPreferredFormat(format)}
                type="button"
                className={`py-2 px-3 rounded-lg font-medium text-xs transition-all shadow-elevation-sm ${
                  preferredFormat === format
                    ? "bg-[#BEC2FF] text-white shadow-elevation-md scale-105"
                    : "bg-white/80 backdrop-blur-sm text-[#010507] border-2 border-[#DBDBE5] hover:border-[#BEC2FF]"
                }`}
              >
                <div className="text-base mb-0.5">
                  {format === "virtual" && "💻"}
                  {format === "in-person" && "🏢"}
                  {format === "hybrid" && "🔁"}
                </div>
                <div className="capitalize">{format.replace("-", " ")}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#010507] mb-1.5">Availability</label>
          <input
            type="text"
            value={availability}
            onChange={(event) => setAvailability(event.target.value)}
            placeholder="e.g., Weekday evenings, Saturday mornings"
            className="w-full px-3 py-2 text-sm rounded-lg border-2 border-[#DBDBE5] bg-white/80 backdrop-blur-sm focus:border-[#BEC2FF] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#010507] mb-1.5">Insurance / payment</label>
          <input
            type="text"
            value={insurance}
            onChange={(event) => setInsurance(event.target.value)}
            placeholder="Insurance provider, sliding scale, private pay..."
            className="w-full px-3 py-2 text-sm rounded-lg border-2 border-[#DBDBE5] bg-white/80 backdrop-blur-sm focus:border-[#BEC2FF] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#010507] mb-1.5">Anything else to honor?</label>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Safety considerations, cultural needs, therapist preferences..."
            rows={2}
            className="w-full px-3 py-2 text-sm rounded-lg border-2 border-[#DBDBE5] bg-white/80 backdrop-blur-sm focus:border-[#BEC2FF] focus:outline-none resize-none"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        className="mt-4 w-full py-2.5 text-sm font-semibold rounded-lg bg-[#1B936F] text-white shadow-elevation-md hover:bg-[#17825F] transition-colors"
      >
        Share intake details
      </button>
    </div>
  );
};
