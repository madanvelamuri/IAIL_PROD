
import React, { useMemo, useState } from "react";

import {
  Search,
  LayoutDashboard,
  ClipboardPlus,
  Bell,
  Settings,
  UserRound,
  LockKeyhole,
  MessageSquare,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Users,
  CircleHelp,
  FileText,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";

// ==========================================
// HELP CONTENT
// ==========================================

const helpSections = [
  {
    id: "dashboard",
    title: "Dashboard",
    category: "Main Features",
    icon: LayoutDashboard,
    description:
      "The Dashboard provides an overview of mistake-tracking information and available performance analytics.",
    steps: [
      "Log in to your IAIL account.",
      "Open Dashboard from the sidebar.",
      "Review the available summary cards and charts.",
      "Use the available filters to find specific records.",
      "Review the displayed information and export reports where available.",
    ],
    tips: [
      "Use filters to narrow down the records.",
      "Check the selected date range before reviewing analytics.",
      "Use the refresh option when available to reload information.",
    ],
  },
  {
    id: "add-mistake",
    title: "Add Mistake",
    category: "Main Features",
    icon: ClipboardPlus,
    description:
      "The Add Mistake module allows employees to record mistakes identified during claim quality checks.",
    steps: [
      "Open Add Mistake from the sidebar.",
      "Enter the relevant Claim ID.",
      "Select the employee name.",
      "Choose the appropriate mistake type.",
      "Enter the mistake description.",
      "Attach a screenshot if required.",
      "Review the information and submit the mistake.",
    ],
    tips: [
      "Verify the Claim ID before submission.",
      "Select the correct employee and mistake type.",
      "Provide a clear and accurate description.",
      "Use the screenshot option to support the mistake record where applicable.",
    ],
  },
  {
    id: "teams",
    title: "Teams Notifications",
    category: "Main Features",
    icon: Bell,
    description:
      "The Teams Notifications module supports configured Microsoft Teams notification and reporting workflows.",
    steps: [
      "Open Teams Notifications from the sidebar.",
      "Review the available notification settings.",
      "Select the relevant Teams group or channel where supported.",
      "Use the configured notification options.",
      "Check the notification result where available.",
    ],
    tips: [
      "Verify that the Teams integration is configured.",
      "Check the selected group or channel before sending notifications.",
      "Contact your administrator if notifications fail.",
    ],
  },
  {
    id: "creator",
    title: "Creator Dashboard",
    category: "Administration",
    icon: Settings,
    description:
      "The Creator Dashboard provides authorized administrators with tools to maintain application information and user access.",
    steps: [
      "Log in using an authorized administrator account.",
      "Open Creator Dashboard.",
      "Manage employee information.",
      "Create or update mistake types and descriptions.",
      "Review pending access requests.",
      "Manage user accounts and assigned roles.",
    ],
    tips: [
      "Verify employee details before saving.",
      "Use appropriate mistake descriptions.",
      "Grant administrator access only to authorized users.",
      "Review access requests before creating accounts.",
    ],
  },
  {
    id: "profile",
    title: "Update Profile",
    category: "Account Settings",
    icon: UserRound,
    description:
      "Update your personal account information, including your name, email address and mobile number.",
    steps: [
      "Open Settings from the sidebar.",
      "Select Update Profile.",
      "Review your existing account information.",
      "Edit your name, email address or mobile number.",
      "Click Save Changes.",
      "Check the confirmation message.",
    ],
    tips: [
      "Use a valid email address.",
      "Enter the correct mobile number.",
      "Make sure your updated information is saved successfully.",
    ],
  },
  {
    id: "password",
    title: "Update Password",
    category: "Account Settings",
    icon: LockKeyhole,
    description:
      "Use the password settings page to manage your account password when that feature is available.",
    steps: [
      "Open Settings from the sidebar.",
      "Select Update Password.",
      "Follow the password change instructions shown on the page.",
      "Submit the required information.",
      "Confirm that the password change was successful.",
    ],
    tips: [
      "Never share your password.",
      "Use a strong and unique password.",
      "Contact your administrator if you cannot access your account.",
    ],
  },
  {
    id: "feedback",
    title: "Feedback",
    category: "Account Settings",
    icon: MessageSquare,
    description:
      "The Feedback module allows employees to share suggestions, general feedback, bug reports and feature requests.",
    steps: [
      "Open Settings and select Feedback.",
      "Click Add Feedback.",
      "Choose a feedback category.",
      "Select a rating from one to five stars.",
      "Enter your feedback description.",
      "Click Submit Feedback.",
      "Review your submitted feedback in the feedback list.",
    ],
    tips: [
      "Choose the correct feedback category.",
      "Describe the issue or suggestion clearly.",
      "Avoid including passwords or confidential information.",
      "Use the status filter to find feedback records.",
    ],
  },
];

// ==========================================
// FAQ CONTENT
// ==========================================

const faqs = [
  {
    question: "How do I log in to the application?",
    answer:
      "Open the application login page and enter your registered email address and password. After successful authentication, you will be redirected to the Dashboard.",
  },
  {
    question: "What should I do if I cannot log in?",
    answer:
      "Check your email address and password. Verify that your account is registered and contact your administrator if you continue to experience login issues.",
  },
  {
    question: "How do I submit a mistake?",
    answer:
      "Open Add Mistake, enter the Claim ID, select the employee and mistake type, provide the description, attach supporting information if required, and submit.",
  },
  {
    question: "Can I submit a screenshot?",
    answer:
      "The Add Mistake workflow supports screenshot attachment and preview where configured. Follow the available upload or paste instructions on the page.",
  },
  {
    question: "Who can access Creator Dashboard?",
    answer:
      "Creator Dashboard management actions are intended for authorized administrators. Access is controlled by backend authorization.",
  },
  {
    question: "How do I update my personal details?",
    answer:
      "Go to Settings, select Update Profile, modify your details and click Save Changes.",
  },
  {
    question: "How do I submit feedback?",
    answer:
      "Open Settings → Feedback, click Add Feedback, select a category, provide a rating and description, and submit.",
  },
  {
    question: "Why can't I see my feedback?",
    answer:
      "Check that the feedback filters are set to All Types and All Statuses. If the record is still missing, contact your administrator.",
  },
  {
    question: "What do feedback statuses mean?",
    answer:
      "Open means the feedback is awaiting review. In Progress means it is being reviewed or worked on. Resolved means it has been addressed. Closed means the feedback record has been closed.",
  },
  {
    question: "What should I do if a feature is not working?",
    answer:
      "Refresh the page, check your internet connection and try again. If the issue continues, submit a Bug Report through Feedback or contact your administrator.",
  },
];

// ==========================================
// COMPONENT
// ==========================================

export default function Help() {
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState(null);
  const [activeFaq, setActiveFaq] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = [
    "All",
    "Main Features",
    "Administration",
    "Account Settings",
  ];

  // ==========================================
  // SEARCH FILTER
  // ==========================================

  const filteredSections = useMemo(() => {
    const query = search.trim().toLowerCase();

    return helpSections.filter((section) => {
      const matchesCategory =
        activeCategory === "All" ||
        section.category === activeCategory;

      const searchableText = [
        section.title,
        section.description,
        ...section.steps,
        ...section.tips,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  const filteredFaqs = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return faqs;

    return faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
    );
  }, [search]);

  // ==========================================
  // OPEN SECTION
  // ==========================================

  const openSection = (id) => {
    setActiveSection(
      activeSection === id ? null : id
    );
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6">

      <div className="mx-auto max-w-7xl space-y-6">

        {/* ==================================
            PAGE HEADER
        ================================== */}

        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">

          <div className="flex items-start gap-4">

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
              <BookOpen size={29} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
                Help & User Guide
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                Welcome to the IAIL Mistake Tracking System.
                Find instructions, understand application
                features and learn how to use the system.
              </p>
            </div>

          </div>

          {/* SEARCH */}

          <div className="relative mt-7">

            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search help topics, features or questions..."
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-4 pl-12 pr-12 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                aria-label="Clear search"
              >
                <X size={18} />
              </button>
            )}

          </div>

        </section>

        {/* ==================================
            QUICK INTRODUCTION
        ================================== */}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <LayoutDashboard
              size={25}
              className="mb-3 text-blue-600"
            />

            <h3 className="font-bold text-gray-800">
              Track Performance
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Review available mistake records and
              performance analytics.
            </p>
          </div>

          <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5">
            <ClipboardPlus
              size={25}
              className="mb-3 text-purple-600"
            />

            <h3 className="font-bold text-gray-800">
              Record Mistakes
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Submit claim-related QC mistakes with
              the required details.
            </p>
          </div>

          <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
            <MessageSquare
              size={25}
              className="mb-3 text-green-600"
            />

            <h3 className="font-bold text-gray-800">
              Share Feedback
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Share suggestions and report issues
              to improve the application.
            </p>
          </div>

        </section>

        {/* ==================================
            FEATURE CATEGORIES
        ================================== */}

        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">

          <div className="mb-5">
            <h2 className="text-lg font-bold text-gray-800">
              Application Features
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Select a category to find the information
              you need.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">

            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeCategory === category
                    ? "bg-indigo-600 text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {category}
              </button>
            ))}

          </div>

          {/* FEATURE LIST */}

          <div className="mt-6 space-y-3">

            {filteredSections.length === 0 ? (

              <div className="rounded-xl bg-gray-50 p-8 text-center">
                <Search
                  size={30}
                  className="mx-auto mb-3 text-gray-300"
                />

                <p className="font-semibold text-gray-700">
                  No help topics found
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Try another search or category.
                </p>
              </div>

            ) : (

              filteredSections.map((section) => {
                const Icon = section.icon;
                const isOpen =
                  activeSection === section.id;

                return (
                  <div
                    key={section.id}
                    className="overflow-hidden rounded-2xl border border-gray-200 transition hover:border-indigo-200"
                  >

                    {/* FEATURE HEADER */}

                    <button
                      type="button"
                      onClick={() => openSection(section.id)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-4 p-4 text-left transition hover:bg-gray-50 sm:p-5"
                    >

                      <div className="flex min-w-0 items-center gap-4">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                          <Icon size={22} />
                        </div>

                        <div className="min-w-0">

                          <h3 className="font-bold text-gray-800">
                            {section.title}
                          </h3>

                          <p className="mt-1 text-xs text-gray-400">
                            {section.category}
                          </p>

                        </div>

                      </div>

                      <ChevronDown
                        size={20}
                        className={`shrink-0 text-gray-400 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />

                    </button>

                    {/* FEATURE DETAILS */}

                    {isOpen && (
                      <div className="border-t border-gray-100 bg-gray-50 p-5">

                        <p className="text-sm leading-7 text-gray-600">
                          {section.description}
                        </p>

                        {/* STEPS */}

                        <div className="mt-5">

                          <h4 className="mb-3 flex items-center gap-2 font-bold text-gray-800">
                            <CheckCircle
                              size={17}
                              className="text-green-600"
                            />

                            How to use
                          </h4>

                          <ol className="space-y-3">

                            {section.steps.map((step, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-3 text-sm leading-6 text-gray-600"
                              >

                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                                  {index + 1}
                                </span>

                                <span>{step}</span>

                              </li>
                            ))}

                          </ol>

                        </div>

                        {/* TIPS */}

                        <div className="mt-6 rounded-xl border border-amber-100 bg-amber-50 p-4">

                          <h4 className="mb-3 flex items-center gap-2 font-bold text-amber-800">
                            <Lightbulb size={17} />

                            Helpful Tips
                          </h4>

                          <ul className="space-y-2">

                            {section.tips.map((tip, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2 text-sm leading-6 text-amber-900"
                              >
                                <CheckCircle
                                  size={15}
                                  className="mt-1 shrink-0"
                                />

                                {tip}
                              </li>
                            ))}

                          </ul>

                        </div>

                      </div>
                    )}

                  </div>
                );
              })

            )}

          </div>

        </section>

        {/* ==================================
            USER GUIDES
        ================================== */}

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">

          {/* EMPLOYEE GUIDE */}

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">

            <div className="mb-5 flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <UserRound size={23} />
              </div>

              <div>
                <h2 className="font-bold text-gray-800">
                  Employee Guide
                </h2>

                <p className="text-xs text-gray-500">
                  Standard user workflow
                </p>
              </div>

            </div>

            <ol className="space-y-4">

              {[
                "Log in using your registered account.",
                "Review available information on Dashboard.",
                "Open Add Mistake to record QC mistakes.",
                "Verify the details before submitting.",
                "Use Feedback to share suggestions or report issues.",
                "Update your personal information through Settings.",
              ].map((item, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-sm text-gray-600"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                    {index + 1}
                  </span>

                  <span className="pt-1 leading-5">
                    {item}
                  </span>
                </li>
              ))}

            </ol>

          </div>

          {/* ADMIN GUIDE */}

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">

            <div className="mb-5 flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                <ShieldCheck size={23} />
              </div>

              <div>
                <h2 className="font-bold text-gray-800">
                  Administrator Guide
                </h2>

                <p className="text-xs text-gray-500">
                  Authorized administrator workflow
                </p>
              </div>

            </div>

            <ol className="space-y-4">

              {[
                "Log in using an authorized administrator account.",
                "Open Creator Dashboard to manage employees and mistake types.",
                "Review access requests and user accounts.",
                "Monitor available dashboard information.",
                "Review submitted employee feedback.",
                "Update feedback status where administrator permissions are enabled.",
              ].map((item, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-sm text-gray-600"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-50 text-xs font-bold text-purple-600">
                    {index + 1}
                  </span>

                  <span className="pt-1 leading-5">
                    {item}
                  </span>
                </li>
              ))}

            </ol>

          </div>

        </section>

        {/* ==================================
            FAQ
        ================================== */}

        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">

          <div className="mb-5 flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <CircleHelp size={24} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-800">
                Frequently Asked Questions
              </h2>

              <p className="text-sm text-gray-500">
                Find answers to common questions.
              </p>
            </div>

          </div>

          <div className="space-y-3">

            {filteredFaqs.length === 0 ? (

              <p className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-500">
                No matching questions found.
              </p>

            ) : (

              filteredFaqs.map((faq, index) => {
                const isOpen = activeFaq === index;

                return (
                  <div
                    key={faq.question}
                    className="overflow-hidden rounded-xl border border-gray-200"
                  >

                    <button
                      type="button"
                      onClick={() =>
                        setActiveFaq(
                          isOpen ? null : index
                        )
                      }
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-gray-50"
                    >

                      <span className="text-sm font-semibold text-gray-700">
                        {faq.question}
                      </span>

                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-gray-400 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />

                    </button>

                    {isOpen && (
                      <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 text-sm leading-7 text-gray-600">
                        {faq.answer}
                      </div>
                    )}

                  </div>
                );
              })

            )}

          </div>

        </section>

        {/* ==================================
            SUPPORT NOTE
        ================================== */}

        <section className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">

          <div className="flex items-start gap-3">

            <AlertCircle
              size={21}
              className="mt-0.5 shrink-0 text-indigo-600"
            />

            <div>

              <h3 className="font-bold text-indigo-900">
                Need additional assistance?
              </h3>

              <p className="mt-1 text-sm leading-6 text-indigo-800">
                If you experience a technical issue, contact
                your system administrator. You can also use
                the Feedback module to submit a Bug Report
                or share a suggestion.
              </p>

            </div>

          </div>

        </section>

        {/* FOOTER */}

        <div className="pb-4 text-center text-xs text-gray-400">
          IAIL Mistake Tracking System · Help & User Guide
        </div>

      </div>
    </div>
  );
}
