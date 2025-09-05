// components/RaggioServizioForm.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Libraries } from "@react-google-maps/api";
import {
  GoogleMap,
  Marker,
  Circle,
  Autocomplete,
  useLoadScript,
} from "@react-google-maps/api";

import { useTranslation } from "@/utils/useTranslation";
import { api } from "@/lib/axios";
import { Button } from '@/components/ui';
import { Save } from "lucide-react";

// ---------- Types ----------
type ChefMeResponse =
  | { id: string }
  | { ok: boolean; data: { id: string } };

type ChefProfileRaw = {
  address?: unknown;
  region?: unknown;
  country?: unknown;          // ISO2
  serviceRadiusKm?: unknown;
};

type ChefProfileEnvelope =
  | ChefProfileRaw
  | { ok: boolean; data: ChefProfileRaw };

type ChefProfile = {
  address: string;
  region: string;
  country: string;            // ISO2
  serviceRadiusKm: number;
};

type Props = {
  initialAddress?: string;
  initialRegion?: string;
  initialCountry?: string;    // ISO2 (ex. "IT")
  initialRadiusKm?: number;   // ex. 50
  initialLat?: number;
  initialLng?: number;
};

// ---------- Const ----------
const MIN_RADIUS = 5;
const MAX_RADIUS = 600;

const mapContainerStyle: React.CSSProperties = { width: "100%", height: "260px" };
const DEFAULT_CENTER = { lat: 45.4642, lng: 9.19 }; // Milano

// ---------- Helpers ----------
function getHttpStatus(e: unknown): number | undefined {
  return (e as { response?: { status?: number } })?.response?.status;
}
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function readChefId(data: ChefMeResponse): string | null {
  if ("id" in data && typeof (data as { id: unknown }).id === "string") {
    return (data as { id: string }).id;
  }
  if ("ok" in data && isRecord((data as { data?: unknown }).data)) {
    const id = (data as { data: { id?: unknown } }).data.id;
    if (typeof id === "string") return id;
  }
  return null;
}
function normalizeCountry(val: unknown, fallback: string): string {
  if (typeof val === "string" && /^[A-Z]{2}$/.test(val)) return val;
  return fallback;
}
function toStringOrEmpty(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function toNumberOr<T extends number>(v: unknown, fallback: T): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function unwrapProfileEnvelope(data: ChefProfileEnvelope): ChefProfileRaw {
  if ("ok" in data && isRecord((data as { data?: unknown }).data)) {
    return (data as { data: ChefProfileRaw }).data;
  }
  return data as ChefProfileRaw;
}
function normalizeProfile(raw: ChefProfileRaw, defaults: ChefProfile): ChefProfile {
  return {
    address: toStringOrEmpty(raw.address) || defaults.address,
    region: toStringOrEmpty(raw.region) || defaults.region,
    country: normalizeCountry(raw.country, defaults.country),
    serviceRadiusKm: toNumberOr(raw.serviceRadiusKm, defaults.serviceRadiusKm),
  };
}

export default function RaggioServizioForm({
  initialAddress = "",
  initialRegion = "",
  initialCountry = "IT",
  initialRadiusKm = 50,
  initialLat,
  initialLng,
}: Props) {
  const { t } = useTranslation("raggioServizio");

  // Google Maps (UI doar pt. IT)
  const libraries: Libraries = ["places"];
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  // chefId din /api/chefs/me
  const [chefId, setChefId] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get<ChefMeResponse>("/api/chefs/me");
        const id = readChefId(res.data);
        if (mounted && id) setChefId(id);
      } catch {
        setChefId(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Form state
  const [address, setAddress] = useState(initialAddress);
  const [region, setRegion] = useState(initialRegion);
  const [country, setCountry] = useState(initialCountry); // ISO2
  const [radiusKm, setRadiusKm] = useState(initialRadiusKm);
  const [saving, setSaving] = useState(false);

  // Dirty + loading + feedback
  const [isDirty, setIsDirty] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; title: string; message: string } | null>(null);

  // Ref cu ultima versiune din DB (pt discard)
  const lastDbProfileRef = useRef<ChefProfile | null>(null);

  // Hartă
  const [position, setPosition] = useState<google.maps.LatLngLiteral>({
    lat: initialLat ?? DEFAULT_CENTER.lat,
    lng: initialLng ?? DEFAULT_CENTER.lng,
  });
  const hasGeocodedRef = useRef(false);

  const mapRef = useRef<google.maps.Map | null>(null);
  const autoRef = useRef<google.maps.places.Autocomplete | null>(null);
  const addressInputRef = useRef<HTMLInputElement | null>(null);

  const isItaly = country === "IT";
  const canSaveBase = address.trim().length > 0 && country.trim().length > 0;
  const canSave = canSaveBase && !!chefId && !loadingProfile;

  const mapOptions = useMemo<google.maps.MapOptions>(
    () => ({
      disableDefaultUI: true,
      zoomControl: true,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#bfbfbf" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a1a" }] },
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
        { featureType: "road", stylers: [{ color: "#2a2a2a" }] },
      ],
    }),
    []
  );

  const radiusMeters = useMemo(() => radiusKm * 1000, [radiusKm]);

  const onLoadMap = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onPlaceChanged = useCallback(() => {
    if (!autoRef.current) return;
    const place = autoRef.current.getPlace();
    const formatted = place.formatted_address || place.name || "";
    if (formatted) setAddress(formatted);

    const comps = place.address_components || [];
    const regionComp = comps.find((c) => c.types.includes("administrative_area_level_1"));
    const countryComp = comps.find((c) => c.types.includes("country"));
    if (regionComp?.long_name) setRegion(regionComp.long_name);
    if (countryComp?.short_name) setCountry(countryComp.short_name); // ISO2

    if (place.geometry?.location) {
      const loc = place.geometry.location;
      const next = { lat: loc.lat(), lng: loc.lng() };
      setPosition(next);
      mapRef.current?.panTo(next);
    }
    setIsDirty(true);
  }, []);

  const onLoadAutocomplete = useCallback((ac: google.maps.places.Autocomplete) => {
    autoRef.current = ac;
    ac.setComponentRestrictions({ country: ["it"] }); // autocomplete doar în Italia
  }, []);

  // Geocod la blur (doar IT)
  const geocodeManuallyTyped = useCallback(async () => {
    if (!isLoaded || !address || !isItaly) return;
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address }, (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
      if (status === "OK" && results && results[0]) {
        const r = results[0];
        const loc = r.geometry.location;
        const next = { lat: loc.lat(), lng: loc.lng() };
        setPosition(next);
        mapRef.current?.panTo(next);

        if (!region) {
          const rc = r.address_components.find((c) =>
            c.types.includes("administrative_area_level_1")
          );
          if (rc?.long_name) setRegion(rc.long_name);
        }
        const cc = r.address_components.find((c) => c.types.includes("country"));
        if (cc?.short_name) setCountry(cc.short_name); // ISO2
        setIsDirty(true);
      } else {
        setFeedback({
          type: "error",
          title: t("profile.serviceRadius.toast.errorTitle"),
          message: t("profile.serviceRadius.address.errors.geocodeFailed"),
        });
        setTimeout(() => setFeedback(null), 3000);
      }
    });
  }, [isLoaded, address, region, isItaly, t]);

  // ---- Fetch profile din DB (la mount și după save) ----
  const loadProfile = useCallback(
    async (force: boolean = false) => {
      if (!chefId) return;
      // dacă userul editează, nu suprascriem decât dacă e force
      if (isDirty && !force) return;

      setLoadingProfile(true);
      try {
        const res = await api.get<ChefProfileEnvelope>(`/api/chefs/${chefId}/profile`);
        const raw = unwrapProfileEnvelope(res.data);
        const normalized = normalizeProfile(raw, {
          address: "",
          region: "",
          country: "IT",
          serviceRadiusKm: 50,
        });

        // setăm form doar dacă nu e dirty (sau am cerut force)
        setAddress(normalized.address);
        setRegion(normalized.region);
        setCountry(normalized.country);
        setRadiusKm(normalized.serviceRadiusKm);
        setIsDirty(false);

        lastDbProfileRef.current = normalized;

        // centrează harta după address (o singură dată), doar pentru IT
        if (isLoaded && normalized.country === "IT" && normalized.address && !hasGeocodedRef.current) {
          hasGeocodedRef.current = true;
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ address: normalized.address }, (results, status) => {
            if (status === "OK" && results && results[0]) {
              const loc = results[0].geometry.location;
              setPosition({ lat: loc.lat(), lng: loc.lng() });
            }
          });
        }
      } catch (err) {
        const status = getHttpStatus(err);
        // 404 = profil inexistent => rămân valorile curente/implicit
        if (!status || status >= 500) {
          setFeedback({
            type: "error",
            title: t("profile.serviceRadius.toast.errorTitle"),
            message: t("profile.serviceRadius.api.networkError"),
          });
          setTimeout(() => setFeedback(null), 3000);
        }
      } finally {
        setLoadingProfile(false);
      }
    },
    [chefId, isDirty, isLoaded, t]
  );

  useEffect(() => {
    void loadProfile(false);
  }, [loadProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    if (radiusKm < MIN_RADIUS) {
      setFeedback({
        type: "error",
        title: t("profile.serviceRadius.toast.errorTitle"),
        message: t("profile.serviceRadius.radius.errors.min").replace("{{min}}", String(MIN_RADIUS)),
      });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    if (radiusKm > MAX_RADIUS) {
      setFeedback({
        type: "error",
        title: t("profile.serviceRadius.toast.errorTitle"),
        message: t("profile.serviceRadius.radius.errors.max").replace("{{max}}", String(MAX_RADIUS)),
      });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    try {
      setSaving(true);

      await api.patch(`/api/chefs/${chefId}/profile`, {
        address,
        region: region || null,
        country, // ISO2
        serviceRadiusKm: radiusKm,
      });

      setIsDirty(false);
      lastDbProfileRef.current = { address, region, country, serviceRadiusKm: radiusKm };

      setFeedback({
        type: "success",
        title: t("profile.serviceRadius.toast.successTitle"),
        message: t("profile.serviceRadius.toast.successMessage"),
      });

      // reîncarcă din DB (doar dacă nu e dirty; după save am setat isDirty=false)
      await loadProfile(false);
    } catch (err) {
      const status = getHttpStatus(err);
      const isValidation = status === 400 || status === 422;
      setFeedback({
        type: "error",
        title: t("profile.serviceRadius.toast.errorTitle"),
        message: isValidation
          ? t("profile.serviceRadius.api.validationFailed")
          : t("profile.serviceRadius.api.networkError"),
      });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  // Handlere care setează dirty:
  const onChangeAddress = (v: string) => { setAddress(v); setIsDirty(true); };
  const onChangeRegion  = (v: string) => { setRegion(v);  setIsDirty(true); };
  const onChangeCountry = (v: string) => { setCountry(v); setIsDirty(true); };
  const onChangeRadius  = (v: number) => { setRadiusKm(v); setIsDirty(true); };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-2xl border border-zinc-800 bg-[#0f0f0f] p-6 shadow-xl mb-12"
    >
      <h2 className="text-xl font-semibold text-white">
        {t("profile.serviceRadius.title")}
      </h2>

      <div className="mt-6 rounded-xl border border-zinc-800 p-5">
        <p className="text-[11px] tracking-wider text-zinc-400">
          {t("profile.serviceRadius.sectionLabel")}
        </p>

        {/* Address */}
        <label className="mt-4 block text-sm text-zinc-200">
          {t("profile.serviceRadius.address.label")} <span className="text-[#C7AE6A]">*</span>
          <div className="mt-2">
            {isLoaded && isItaly ? (
              <Autocomplete onLoad={onLoadAutocomplete} onPlaceChanged={onPlaceChanged}>
                <input
                  ref={addressInputRef}
                  type="text"
                  placeholder={t("profile.serviceRadius.address.placeholder")}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-zinc-100 placeholder-zinc-500 outline-none focus:border-[#C7AE6A] focus:ring-1 focus:ring-[#C7AE6A]"
                  value={address}
                  onChange={(e) => onChangeAddress(e.target.value)}
                  onBlur={geocodeManuallyTyped}
                  required
                  disabled={loadingProfile}
                />
              </Autocomplete>
            ) : (
              <input
                type="text"
                placeholder={t("profile.serviceRadius.address.placeholder")}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-zinc-100 placeholder-zinc-500 outline-none focus:border-[#C7AE6A33] focus:ring-1 focus:ring-[#C7AE6A33]"
                value={address}
                onChange={(e) => onChangeAddress(e.target.value)}
                required
                disabled={loadingProfile}
              />
            )}
          </div>
        </label>

        {/* Region */}
        <label className="mt-4 block text-sm text-zinc-200">
          {t("profile.serviceRadius.region.label")}
          <input
            type="text"
            placeholder={t("profile.serviceRadius.region.placeholder")}
            className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-zinc-100 placeholder-zinc-500 outline-none focus:border-[#C7AE6A33] focus:ring-1 focus:ring-[#C7AE6A33]"
            value={region}
            onChange={(e) => onChangeRegion(e.target.value)}
            disabled={loadingProfile}
          />
        </label>

        {/* Country (ISO2) */}
        <label className="mt-4 block text-sm text-zinc-200">
          {t("profile.serviceRadius.country.label")} <span className="text-[#C7AE6A]">*</span>
          <div className="relative mt-2">
            <select
              className="w-full appearance-none rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 pr-9 text-zinc-100 outline-none focus:border-[#C7AE6A33] focus:ring-1 focus:ring-[#C7AE6A33]"
              value={country}
              onChange={(e) => onChangeCountry(e.target.value)}
              required
              disabled={loadingProfile}
            >
              <option value="IT">Italia</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">▾</span>
          </div>
        </label>

        {/* Hartă — doar pentru IT */}
        <div className="mt-6">
          {isItaly ? (
            isLoaded ? (
              <GoogleMap
                onLoad={onLoadMap}
                mapContainerStyle={mapContainerStyle}
                center={position}
                zoom={8} // era 11, acum mai mic pentru a vedea regiunea
                options={mapOptions}
              >
                <Marker
                  position={position}
                  draggable
                  onDragEnd={(e: google.maps.MapMouseEvent) => {
                    const lat = e.latLng?.lat() ?? position.lat;
                    const lng = e.latLng?.lng() ?? position.lng;
                    setPosition({ lat, lng });
                    setIsDirty(true);
                  }}
                />
                <Circle
                  center={position}
                  radius={radiusMeters}
                  options={{
                    strokeColor: "#C7AE6A", // culoarea bordurii cercului
                    strokeOpacity: 0.6,
                    strokeWeight: 1.5,
                    fillOpacity: 0.12
                  }}
                />
              </GoogleMap>
            ) : (
              <div className="flex h-[260px] items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 text-center text-xs text-[#C7AE6A]">
                {t("profile.serviceRadius.map.loading")}
              </div>
            )
          ) : (
            <div className="flex h-[120px] items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 text-center text-xs text-zinc-300">
              {t("profile.serviceRadius.map.onlyItaly")}
            </div>
          )}
        </div>
      </div>

      {/* Radius */}
      <div className="mt-8">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-zinc-300">{t("profile.serviceRadius.radius.label")}</span>
          <span className="text-xs text-zinc-500">
            {radiusKm} {t("profile.serviceRadius.radius.unit")}
          </span>
        </div>

        <input
          type="range"
          min={MIN_RADIUS}
          max={MAX_RADIUS}
          step={5}
          value={radiusKm}
          onChange={(e) => onChangeRadius(parseInt(e.target.value, 10))}
          className="w-full accent-[#C7AE6A]"
          aria-label={t("profile.serviceRadius.radius.label")}
          disabled={loadingProfile}
        />

        <div className="mt-6 rounded-lg border border-amber-800/40 bg-amber-900/10 p-3 text-xs text-amber-300">
          <strong>{t("profile.serviceRadius.notice.title")}</strong>{" "}
          {t("profile.serviceRadius.notice.text")}
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          role="status"
          className={`mt-6 rounded-lg border px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-emerald-700/40 bg-emerald-900/10 text-emerald-300"
              : "border-rose-700/40 bg-rose-900/10 text-rose-300"
          }`}
        >
          <strong className="mr-1">{feedback.title}</strong>
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 flex items-center gap-3 justify-center lg:justify-start">
        <Button
          type="submit"
          disabled={!canSave || saving}
          variant="primary"
          className="flex items-center  transition  disabled:cursor-not-allowed disabled:opacity-60"
          aria-disabled={!canSave || saving}
          title={!chefId ? "Not ready: missing user id" : undefined}
        >
            <span className="flex items-center gap-2">
            <Save />
          {saving
            ? t("profile.serviceRadius.actions.saving")
            : t("profile.serviceRadius.actions.save")}
            </span>
        </Button>
      </div>
    </form>
  );
}
