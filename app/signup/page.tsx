"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

interface FieldErrors {
  name?: string[];
  email?: string[];
  password?: string[];
  country?: string[];
  timezone?: string[];
  language?: string[];
  stateRegion?: string[];
  role?: string[];
  useCases?: string[];
  companyName?: string[];
  teamSize?: string[];
}

const ROLES = [
  "Filmmaker",
  "Producer",
  "Screenwriter",
  "Production company",
  "Studio",
  "Agency",
  "Other",
];

const USE_CASES = [
  "Script analysis",
  "Film greenlighting",
  "Market research",
  "Pre-production",
  "Production management",
  "Multiple purposes",
];

const TEAM_SIZES = ["Just me", "2–5", "6–20", "21–50", "50+"];

const LANGUAGES = [
  "English",
  "French",
  "Spanish",
  "German",
  "Other",
];

const DEFAULT_TIMEZONES_BY_COUNTRY: Record<string, string> = {
  Nigeria: "Africa/Lagos",
  "United States of America": "America/New_York",
  "United Kingdom": "Europe/London",
  Canada: "America/Toronto",
  Australia: "Australia/Sydney",
  France: "Europe/Paris",
  Germany: "Europe/Berlin",
  India: "Asia/Kolkata",
  Japan: "Asia/Tokyo",
  China: "Asia/Shanghai",
  Brazil: "America/Sao_Paulo",
  "South Africa": "Africa/Johannesburg",
};

const REGIONS_BY_COUNTRY: Record<string, string[]> = {
  Nigeria: [
    "Abia",
    "Adamawa",
    "Akwa Ibom",
    "Anambra",
    "Bauchi",
    "Bayelsa",
    "Benue",
    "Borno",
    "Cross River",
    "Delta",
    "Ebonyi",
    "Edo",
    "Ekiti",
    "Enugu",
    "FCT - Abuja",
    "Gombe",
    "Imo",
    "Jigawa",
    "Kaduna",
    "Kano",
    "Katsina",
    "Kebbi",
    "Kogi",
    "Kwara",
    "Lagos",
    "Nasarawa",
    "Niger",
    "Ogun",
    "Ondo",
    "Osun",
    "Oyo",
    "Plateau",
    "Rivers",
    "Sokoto",
    "Taraba",
    "Yobe",
    "Zamfara",
  ],

  "United States of America": [
    "Alabama",
    "Alaska",
    "Arizona",
    "Arkansas",
    "California",
    "Colorado",
    "Connecticut",
    "Delaware",
    "Florida",
    "Georgia",
    "Hawaii",
    "Idaho",
    "Illinois",
    "Indiana",
    "Iowa",
    "Kansas",
    "Kentucky",
    "Louisiana",
    "Maine",
    "Maryland",
    "Massachusetts",
    "Michigan",
    "Minnesota",
    "Mississippi",
    "Missouri",
    "Montana",
    "Nebraska",
    "Nevada",
    "New Hampshire",
    "New Jersey",
    "New Mexico",
    "New York",
    "North Carolina",
    "North Dakota",
    "Ohio",
    "Oklahoma",
    "Oregon",
    "Pennsylvania",
    "Rhode Island",
    "South Carolina",
    "South Dakota",
    "Tennessee",
    "Texas",
    "Utah",
    "Vermont",
    "Virginia",
    "Washington",
    "West Virginia",
    "Wisconsin",
    "Wyoming",
  ],

  "United Kingdom": [
    "England",
    "Scotland",
    "Wales",
    "Northern Ireland",
  ],

  Canada: [
    "Alberta",
    "British Columbia",
    "Manitoba",
    "New Brunswick",
    "Newfoundland and Labrador",
    "Nova Scotia",
    "Ontario",
    "Prince Edward Island",
    "Quebec",
    "Saskatchewan",
  ],

  Australia: [
    "New South Wales",
    "Queensland",
    "South Australia",
    "Tasmania",
    "Victoria",
    "Western Australia",
  ],
};

const DEFAULT_REGIONS = [
  "Central Region",
  "Northern Region",
  "Southern Region",
  "Eastern Region",
  "Western Region",
  "Other",
];

const COUNTRIES = [
  "Nigeria",
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo (Congo-Brazzaville)",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czechia (Czech Republic)",
  "Democratic Republic of the Congo",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Holy See",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Ivory Coast",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar (formerly Burma)",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine State",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States of America",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

// Helper to detect the browser timezone safely.
function getBrowserTimezone(): string {
  if (typeof window === "undefined") {
    return "Africa/Lagos";
  }

  try {
    return (
      Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
    );
  } catch {
    return "UTC";
  }
}

// Get an initial region based on timezone/country.
function getInitialRegion(
  country: string,
  timezone: string
): string {
  const regions =
    REGIONS_BY_COUNTRY[country] || DEFAULT_REGIONS;

  const zoneParts = timezone.split("/");
  const location =
    zoneParts[zoneParts.length - 1]?.replace(/_/g, " ") || "";

  const matchedRegion = regions.find((region) =>
    region.toLowerCase().includes(location.toLowerCase())
  );

  return matchedRegion || regions[0];
}

// Helper to calculate password strength score.
function getPasswordStrength(pass: string): {
  score: number;
  label: string;
  color: string;
} {
  if (!pass) {
    return {
      score: 0,
      label: "",
      color: "bg-slate-200",
    };
  }

  let score = 0;

  if (pass.length >= 8) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;

  switch (score) {
    case 1:
      return {
        score: 1,
        label: "Weak",
        color: "bg-red-500",
      };

    case 2:
      return {
        score: 2,
        label: "Fair",
        color: "bg-amber-500",
      };

    case 3:
      return {
        score: 3,
        label: "Good",
        color: "bg-blue-500",
      };

    case 4:
      return {
        score: 4,
        label: "Strong",
        color: "bg-emerald-500",
      };

    default:
      return {
        score: 0,
        label: "Too weak",
        color: "bg-red-500",
      };
  }
}

export default function SignUpPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [showPassword, setShowPassword] = useState(false);

  // Step 1
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2
  const initialTimezone = getBrowserTimezone();

  const [country, setCountry] = useState("Nigeria");

  const [timezone, setTimezone] =
    useState(initialTimezone);

  const [language, setLanguage] =
    useState("English");

  const [stateRegion, setStateRegion] = useState(() =>
    getInitialRegion("Nigeria", initialTimezone)
  );

  // Step 3
  const [role, setRole] = useState("");
  const [selectedUseCases, setSelectedUseCases] =
    useState<string[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [teamSize, setTeamSize] = useState("");

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] =
    useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  const availableRegions =
    REGIONS_BY_COUNTRY[country] || DEFAULT_REGIONS;

  const passwordStrength =
    getPasswordStrength(password);

  const handleCountryChange = (
    newCountry: string
  ) => {
    setCountry(newCountry);

    const inferredTimezone =
      DEFAULT_TIMEZONES_BY_COUNTRY[newCountry] ||
      "UTC";

    setTimezone(inferredTimezone);

    const newRegions =
      REGIONS_BY_COUNTRY[newCountry] ||
      DEFAULT_REGIONS;

    const zoneParts =
      inferredTimezone.split("/");

    const countryLocation =
      zoneParts[zoneParts.length - 1]?.replace(
        /_/g,
        " "
      ) || "";

    const matchedRegion = newRegions.find(
      (region) =>
        region
          .toLowerCase()
          .includes(countryLocation.toLowerCase())
    );

    setStateRegion(
      matchedRegion || newRegions[0]
    );
  };

  const toggleUseCase = (uc: string) => {
    setSelectedUseCases((prev) =>
      prev.includes(uc)
        ? prev.filter((item) => item !== uc)
        : [...prev, uc]
    );
  };

  const validateStep1 = (): boolean => {
    const errors: FieldErrors = {};

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name.trim()) {
      errors.name = ["Full name is required."];
    } else if (name.trim().length < 2) {
      errors.name = [
        "Name must be at least 2 characters long.",
      ];
    }

    if (!email.trim()) {
      errors.email = [
        "Email address is required.",
      ];
    } else if (!emailRegex.test(email.trim())) {
      errors.email = [
        "Please enter a valid email address.",
      ];
    }

    if (!password) {
      errors.password = [
        "Password is required.",
      ];
    } else if (password.length < 8) {
      errors.password = [
        "Password must be at least 8 characters long.",
      ];
    } else if (!/[a-z]/.test(password)) {
      errors.password = [
        "Password must contain at least one lowercase letter.",
      ];
    } else if (!/[A-Z]/.test(password)) {
      errors.password = [
        "Password must contain at least one uppercase letter.",
      ];
    } else if (!/\d/.test(password)) {
      errors.password = [
        "Password must contain at least one number.",
      ];
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errors: FieldErrors = {};

    if (!country) {
      errors.country = [
        "Country is required.",
      ];
    }

    if (!stateRegion) {
      errors.stateRegion = [
        "State or region is required.",
      ];
    }

    if (!timezone.trim()) {
      errors.timezone = [
        "Time zone is required.",
      ];
    }

    if (!language) {
      errors.language = [
        "Language preference is required.",
      ];
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleNextStep1 = (
    e: FormEvent
  ) => {
    e.preventDefault();

    if (!validateStep1()) return;

    setError("");
    setStep(2);
  };

  const handleNextStep2 = (
    e: FormEvent
  ) => {
    e.preventDefault();

    if (!validateStep2()) return;

    setError("");
    setStep(3);
  };

  async function handleSubmit(
    event?: FormEvent
  ) {
    if (event) {
      event.preventDefault();
    }

    setError("");
    setFieldErrors({});
    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user: {
              name: name.trim(),
              email: email.trim().toLowerCase(),
              password,
            },

            profile: {
              country,
              timezone,
              language,
              stateRegion:
                stateRegion || undefined,
              role: role || undefined,
              useCases: selectedUseCases,
              companyName:
                companyName.trim() || undefined,
              teamSize:
                teamSize || undefined,
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to create account"
        );

        if (data.errors) {
          setFieldErrors(data.errors);
        }

        return;
      }

      const signInResult = await signIn(
        "credentials",
        {
          email: email.trim().toLowerCase(),
          password,
          redirect: false,
        }
      );

      if (signInResult?.error) {
        router.push("/signin");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error(
        "Signup request failed:",
        error
      );

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-indigo-200/50 blur-[120px]" />

      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-xl sm:p-10">

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span
              className={
                step >= 1
                  ? "text-indigo-600"
                  : ""
              }
            >
              1. Account
            </span>

            <span
              className={
                step >= 2
                  ? "text-indigo-600"
                  : ""
              }
            >
              2. Location
            </span>

            <span
              className={
                step >= 3
                  ? "text-indigo-600"
                  : ""
              }
            >
              3. Workspace
            </span>
          </div>

          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-indigo-600 transition-all duration-300 ease-in-out"
              style={{
                width: `${(step / 3) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Create your account
              </h1>

              <p className="mt-2 text-sm text-slate-600">
                Start setting up your StudioOS workspace.
              </p>
            </div>

            <form
              onSubmit={handleNextStep1}
              className="mt-8 space-y-4"
              noValidate
            >
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  Full Name
                </label>

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);

                    if (fieldErrors.name) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        name: undefined,
                      }));
                    }
                  }}
                  placeholder="Jane Doe"
                  className={`mt-1.5 w-full rounded-xl border bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:bg-white focus:ring-2 ${
                    fieldErrors.name
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/20"
                  }`}
                />

                {fieldErrors.name?.[0] && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldErrors.name[0]}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);

                    if (fieldErrors.email) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        email: undefined,
                      }));
                    }
                  }}
                  placeholder="name@example.com"
                  className={`mt-1.5 w-full rounded-xl border bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:bg-white focus:ring-2 ${
                    fieldErrors.email
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/20"
                  }`}
                />

                {fieldErrors.email?.[0] && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldErrors.email[0]}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  Password
                </label>

                <div className="relative mt-1.5">
                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);

                      if (fieldErrors.password) {
                        setFieldErrors(
                          (prev) => ({
                            ...prev,
                            password:
                              undefined,
                          })
                        );
                      }
                    }}
                    placeholder="••••••••"
                    className={`w-full rounded-xl border bg-slate-50/50 py-3 pl-4 pr-11 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:bg-white focus:ring-2 ${
                      fieldErrors.password
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/20"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                        />

                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    )}
                  </button>
                </div>

                {password && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-slate-100">
                      {[1, 2, 3, 4].map(
                        (level) => (
                          <div
                            key={level}
                            className={`h-full flex-1 transition-colors duration-300 ${
                              level <=
                              passwordStrength.score
                                ? passwordStrength.color
                                : "bg-slate-200"
                            }`}
                          />
                        )
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">
                        Strength:
                      </span>

                      <span className="font-semibold text-slate-700">
                        {passwordStrength.label}
                      </span>
                    </div>
                  </div>
                )}

                {fieldErrors.password?.[0] && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldErrors.password[0]}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="mt-4 flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 active:scale-[0.98]"
              >
                Continue to Location
              </button>
            </form>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Location & Region
              </h1>

              <p className="mt-2 text-sm text-slate-600">
                Helps StudioOS optimize local scheduling and region defaults.
              </p>
            </div>

            <form
              onSubmit={handleNextStep2}
              className="mt-8 space-y-4"
              noValidate
            >
              {/* Country */}
              <div>
                <label
                  htmlFor="country"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  Country
                </label>

                <select
                  id="country"
                  value={country}
                  onChange={(e) => {
                    handleCountryChange(
                      e.target.value
                    );

                    if (fieldErrors.country) {
                      setFieldErrors(
                        (prev) => ({
                          ...prev,
                          country:
                            undefined,
                        })
                      );
                    }
                  }}
                  className={`mt-1.5 w-full rounded-xl border bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:bg-white focus:ring-2 ${
                    fieldErrors.country
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/20"
                  }`}
                >
                  {COUNTRIES.map((c) => (
                    <option
                      key={c}
                      value={c}
                    >
                      {c}
                    </option>
                  ))}
                </select>

                {fieldErrors.country?.[0] && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldErrors.country[0]}
                  </p>
                )}
              </div>

              {/* State */}
              <div>
                <label
                  htmlFor="stateRegion"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  State / Region
                </label>

                <select
                  id="stateRegion"
                  value={stateRegion}
                  onChange={(e) => {
                    setStateRegion(
                      e.target.value
                    );

                    if (
                      fieldErrors.stateRegion
                    ) {
                      setFieldErrors(
                        (prev) => ({
                          ...prev,
                          stateRegion:
                            undefined,
                        })
                      );
                    }
                  }}
                  className={`mt-1.5 w-full rounded-xl border bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:bg-white focus:ring-2 ${
                    fieldErrors.stateRegion
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/20"
                  }`}
                >
                  {availableRegions.map(
                    (region) => (
                      <option
                        key={region}
                        value={region}
                      >
                        {region}
                      </option>
                    )
                  )}
                </select>

                {fieldErrors.stateRegion?.[0] && (
                  <p className="mt-1 text-xs text-red-600">
                    {
                      fieldErrors
                        .stateRegion[0]
                    }
                  </p>
                )}
              </div>

              {/* Timezone */}
              <div>
                <label
                  htmlFor="timezone"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  Time Zone
                </label>

                <input
                  id="timezone"
                  type="text"
                  value={timezone}
                  onChange={(e) => {
                    setTimezone(
                      e.target.value
                    );

                    if (
                      fieldErrors.timezone
                    ) {
                      setFieldErrors(
                        (prev) => ({
                          ...prev,
                          timezone:
                            undefined,
                        })
                      );
                    }
                  }}
                  placeholder="e.g. Africa/Lagos"
                  className={`mt-1.5 w-full rounded-xl border bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:bg-white focus:ring-2 ${
                    fieldErrors.timezone
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/20"
                  }`}
                />

                {fieldErrors.timezone?.[0] && (
                  <p className="mt-1 text-xs text-red-600">
                    {
                      fieldErrors
                        .timezone[0]
                    }
                  </p>
                )}
              </div>

              {/* Language */}
              <div>
                <label
                  htmlFor="language"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  Preferred Language
                </label>

                <select
                  id="language"
                  value={language}
                  onChange={(e) => {
                    setLanguage(
                      e.target.value
                    );

                    if (
                      fieldErrors.language
                    ) {
                      setFieldErrors(
                        (prev) => ({
                          ...prev,
                          language:
                            undefined,
                        })
                      );
                    }
                  }}
                  className={`mt-1.5 w-full rounded-xl border bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:bg-white focus:ring-2 ${
                    fieldErrors.language
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/20"
                  }`}
                >
                  {LANGUAGES.map(
                    (languageOption) => (
                      <option
                        key={languageOption}
                        value={languageOption}
                      >
                        {languageOption}
                      </option>
                    )
                  )}
                </select>

                {fieldErrors.language?.[0] && (
                  <p className="mt-1 text-xs text-red-600">
                    {
                      fieldErrors
                        .language[0]
                    }
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setStep(1)
                  }
                  className="w-1/3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Back
                </button>

                <button
                  type="submit"
                  className="w-2/3 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 active:scale-[0.98]"
                >
                  Continue to Workspace
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                About Your Workspace
              </h1>

              <p className="mt-2 text-sm text-slate-600">
                Personalizes your StudioOS experience. You can skip this step.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-5"
            >
              {/* Role */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  What best describes you?
                </label>

                <div className="mt-2 flex flex-wrap gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() =>
                        setRole(
                          role === r
                            ? ""
                            : r
                        )
                      }
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                        role === r
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Use cases */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Hoping to use StudioOS for?{" "}
                  <span className="font-normal lowercase text-slate-400">
                    (select all)
                  </span>
                </label>

                <div className="mt-2 flex flex-wrap gap-2">
                  {USE_CASES.map(
                    (uc) => {
                      const isSelected =
                        selectedUseCases.includes(
                          uc
                        );

                      return (
                        <button
                          key={uc}
                          type="button"
                          onClick={() =>
                            toggleUseCase(
                              uc
                            )
                          }
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                              : "border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          {uc}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Company */}
              <div>
                <label
                  htmlFor="company"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  Company / Studio Name{" "}
                  <span className="font-normal lowercase text-slate-400">
                    (optional)
                  </span>
                </label>

                <input
                  id="company"
                  type="text"
                  value={companyName}
                  onChange={(e) =>
                    setCompanyName(
                      e.target.value
                    )
                  }
                  placeholder="e.g. Apex Studios"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-600/20"
                />
              </div>

              {/* Team size */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Team Size
                </label>

                <div className="mt-2 flex flex-wrap gap-2">
                  {TEAM_SIZES.map(
                    (size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() =>
                          setTeamSize(
                            teamSize ===
                              size
                              ? ""
                              : size
                          )
                        }
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                          teamSize ===
                          size
                            ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                            : "border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        {size}
                      </button>
                    )
                  )}
                </div>
              </div>

              {error && (
                <div
                  className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-xs font-medium text-red-600"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    handleSubmit()
                  }
                  disabled={loading}
                  className="w-1/3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Skip
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-2/3 items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4 animate-spin text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />

                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>

                      Creating...
                    </span>
                  ) : (
                    "Create Workspace"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-slate-600">
          Already have an account?{" "}

          <a
            href="/signin"
            className="font-semibold text-indigo-600 transition hover:text-indigo-500 hover:underline"
          >
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}