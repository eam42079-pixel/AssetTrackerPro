"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const TEST_RECIPIENT = "earrieta@tanmarcompanies.com";

type Receiver = {
  asset: string;
  model: string;
  type: string;
  serial: string;
  rid: string;
  card: string;
  rentState: string;
  accountNumber: string;
  accountName: string;
  recordedLocation: string;
  office: string;
};

type GpsPing = {
  latitude: number;
  longitude: number;
  accuracy: number;
  capturedAt: string;
};

const valueOrDash = (value: string) => value || "—";

export default function Home() {
  const [receiver, setReceiver] = useState<Receiver>({
    asset: "",
    model: "",
    type: "",
    serial: "",
    rid: "",
    card: "",
    rentState: "",
    accountNumber: "",
    accountName: "",
    recordedLocation: "",
    office: "",
  });
  const [errorCode, setErrorCode] = useState("");
  const [operatorName, setOperatorName] = useState("");
  const [rigFrac, setRigFrac] = useState("");
  const [lease, setLease] = useState("");
  const [gps, setGps] = useState<GpsPing | null>(null);
  const [locationState, setLocationState] = useState<
    "idle" | "requesting" | "ready" | "error"
  >("idle");
  const [message, setMessage] = useState(
    "Allow GPS access to create this service request.",
  );
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setReceiver({
      asset: params.get("a") || "",
      model: params.get("m") || "",
      type: params.get("t") || "",
      serial: params.get("s") || "",
      rid: params.get("r") || "",
      card: params.get("c") || "",
      rentState: params.get("rs") || "",
      accountNumber: params.get("an") || "",
      accountName: params.get("ac") || "",
      recordedLocation: params.get("al") || "",
      office: params.get("ao") || "",
    });
  }, []);

  const details = useMemo(
    () =>
      [
        ["Model", receiver.model],
        ["Receiver Type", receiver.type],
        ["Serial Number", receiver.serial],
        ["Receiver ID (RID)", receiver.rid],
        ["Access Card", receiver.card],
        ["Rent Status", receiver.rentState],
        ["Current Account", receiver.accountNumber],
        ["Account Name", receiver.accountName],
        ["Recorded Location", receiver.recordedLocation],
        ["Office / Yard", receiver.office],
      ].filter(([, value]) => value),
    [receiver],
  );

  const requestLocation = useCallback(() => {
    setFormError("");
    if (!navigator.geolocation) {
      setGps(null);
      setLocationState("error");
      setMessage("GPS location is not available on this device.");
      return;
    }

    setLocationState("requesting");
    setMessage("Approve the location prompt on your device.");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const ping = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          capturedAt: new Date().toISOString(),
        };
        setGps(ping);
        setLocationState("ready");
        setMessage(
          `${ping.latitude.toFixed(6)}, ${ping.longitude.toFixed(6)} · accuracy ${Math.round(ping.accuracy)} m`,
        );
      },
      () => {
        setGps(null);
        setLocationState("error");
        setMessage(
          "Location permission must be allowed before this request can be created.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  function openEmail(trimmedError: string, location: GpsPing) {
    const mapsLink = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
    const body = [
      "Please reactivate or refresh this receiver.",
      "",
      `On-Screen Error Code: ${trimmedError}`,
      "",
      "WORK SITE INFORMATION",
      `Operator Name: ${operatorName.trim()}`,
      `Rig/Frac: ${rigFrac.trim()}`,
      `Lease: ${lease.trim()}`,
      "",
      "RECEIVER INFORMATION",
      `Asset Number: ${valueOrDash(receiver.asset)}`,
      `Model: ${valueOrDash(receiver.model)}`,
      `Receiver Type: ${valueOrDash(receiver.type)}`,
      `Serial Number: ${valueOrDash(receiver.serial)}`,
      `Receiver ID (RID): ${valueOrDash(receiver.rid)}`,
      `Access Card: ${valueOrDash(receiver.card)}`,
      `Rent Status: ${valueOrDash(receiver.rentState)}`,
      `Current Account: ${valueOrDash(receiver.accountNumber)}`,
      `Account Name: ${valueOrDash(receiver.accountName)}`,
      `Recorded Location: ${valueOrDash(receiver.recordedLocation)}`,
      `Office / Yard: ${valueOrDash(receiver.office)}`,
      "",
      "SCAN LOCATION",
      `GPS Coordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
      `GPS Accuracy: ${Math.round(location.accuracy)} meters`,
      `Map: ${mapsLink}`,
      `Captured: ${new Date(location.capturedAt).toLocaleString()}`,
    ].join("\n");
    const subject = `${valueOrDash(receiver.asset)} / Service Request`;
    window.location.href = `mailto:${TEST_RECIPIENT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  async function submitRequest() {
    const trimmedError = errorCode.trim();
    const trimmedOperator = operatorName.trim();
    const trimmedRigFrac = rigFrac.trim();
    const trimmedLease = lease.trim();
    if (!trimmedOperator || !trimmedRigFrac || !trimmedLease) {
      setFormError("Enter the Operator Name, Rig/Frac, and Lease.");
      return;
    }
    if (!trimmedError) {
      setFormError("Enter the on-screen error code.");
      return;
    }
    if (!gps) {
      setFormError(
        "Location required. Share your GPS location before creating the email.",
      );
      requestLocation();
      return;
    }

    setFormError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          assetNumber: receiver.asset,
          model: receiver.model,
          receiverType: receiver.type,
          serialNumber: receiver.serial,
          rid: receiver.rid,
          accessCard: receiver.card,
          rentState: receiver.rentState,
          accountNumber: receiver.accountNumber,
          accountName: receiver.accountName,
          recordedLocation: receiver.recordedLocation,
          office: receiver.office,
          operatorName: trimmedOperator,
          rigFrac: trimmedRigFrac,
          lease: trimmedLease,
          errorCode: trimmedError,
          latitude: gps.latitude,
          longitude: gps.longitude,
          gpsAccuracy: gps.accuracy,
          gpsCapturedAt: gps.capturedAt,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Request was not saved.");
      setSubmitted(true);
      openEmail(trimmedError, gps);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to submit the service request.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const canCreateEmail = Boolean(
    gps &&
      operatorName.trim() &&
      rigFrac.trim() &&
      lease.trim() &&
      errorCode.trim(),
  );

  return (
    <main className="request-shell">
      <section className="request-card">
        <div className="company-logo-wrap">
          <img
            className="company-logo"
            src="/tanmar-companies-logo.png"
            alt="TanMar Companies"
          />
        </div>
        <header className="brand-header">
          <img
            className="emblem"
            src="/tanmar-emblem-tight.png"
            alt="TanMar emblem"
          />
          <div>
            <p>TanMar Receiver Control</p>
            <h1>Reactivate or Refresh</h1>
          </div>
        </header>

        <section className="receiver-summary">
          <span>Asset Number</span>
          <strong>{valueOrDash(receiver.asset)}</strong>
          {details.length > 0 && (
            <dl>
              {details.map(([label, value]) => (
                <div className="detail-row" key={label}>
                  <dt>{label}</dt>
                  <dd>{valueOrDash(value)}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        <section className="worksite-fields" aria-label="Work site information">
          <label htmlFor="operatorName">
            <span>
              Operator Name <b>*</b>
            </span>
            <input
              id="operatorName"
              type="text"
              autoComplete="organization"
              maxLength={120}
              required
              placeholder="Enter operator name"
              value={operatorName}
              onChange={(event) => {
                setOperatorName(event.target.value);
                setFormError("");
              }}
            />
          </label>
          <div className="worksite-row">
            <label htmlFor="rigFrac">
              <span>
                Rig/Frac <b>*</b>
              </span>
              <input
                id="rigFrac"
                type="text"
                autoComplete="off"
                maxLength={120}
                required
                placeholder="Enter rig or frac"
                value={rigFrac}
                onChange={(event) => {
                  setRigFrac(event.target.value);
                  setFormError("");
                }}
              />
            </label>
            <label htmlFor="lease">
              <span>
                Lease <b>*</b>
              </span>
              <input
                id="lease"
                type="text"
                autoComplete="off"
                maxLength={120}
                required
                placeholder="Enter lease"
                value={lease}
                onChange={(event) => {
                  setLease(event.target.value);
                  setFormError("");
                }}
              />
            </label>
          </div>
        </section>

        <label className="error-field" htmlFor="errorCode">
          <span>
            On-screen error code <b>*</b>
          </span>
          <input
            id="errorCode"
            type="text"
            inputMode="text"
            autoComplete="off"
            maxLength={80}
            required
            placeholder="Enter the code shown on the TV"
            value={errorCode}
            onChange={(event) => {
              setErrorCode(event.target.value);
              setFormError("");
            }}
          />
        </label>

        <section
          className={`location-panel ${locationState}`}
          aria-live="polite"
        >
          <div className="location-icon">⌖</div>
          <div>
            <strong>
              {locationState === "ready"
                ? "GPS location captured"
                : locationState === "requesting"
                  ? "Requesting location…"
                  : "Location required"}
            </strong>
            <p>{message}</p>
          </div>
        </section>

        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}

        <div className="actions">
          <button
            className="secondary"
            type="button"
            onClick={requestLocation}
            disabled={locationState === "requesting"}
          >
            {gps ? "Refresh GPS Location" : "Share GPS Location"}
          </button>
          <button
            className="primary"
            type="button"
            onClick={submitRequest}
            disabled={!canCreateEmail || submitting || submitted}
          >
            {submitted
              ? "Request Submitted"
              : submitting
                ? "Submitting…"
                : "Submit Service Request"}
          </button>
        </div>

        <p className="privacy-note">
          No login is required. The request is recorded before the prefilled
          email opens. Review the email, then tap Send.
        </p>
        <footer className="service-footer">
          <img src="/tanmar-emblem-tight.png" alt="" />
          <span>TanMar Receiver Control · DirecTV Asset Management</span>
        </footer>
      </section>
    </main>
  );
}
