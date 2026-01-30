// File: lib/university-data.ts

// 1. Paste your Interfaces
export interface EligibilityCriteria {
  minSSCgpa: number;
  minHSCgpa: number;
  minTotalGPA: number;
  minSubjectGPA?: { [subject: string]: number };
  compulsorySubjects?: string[];
  allowedGroups: ("Science" | "Arts" | "Commerce")[];
  secondTimeAllowed: boolean;
}

export interface University {
  id: string;
  name: string;
  logoId: string;
  website: string;
  applicationDate: string; // ISO format: YYYY-MM-DD
  units: {
    [unitName: string]: EligibilityCriteria;
  };
}

// 2. Paste your Data Array
export const universities: University[] = [
  {
    id: "du",
    name: "Dhaka University",
    logoId: "inst-du",
    website: "https://admission.eis.du.ac.bd/",
    applicationDate: "2025-01-15",
    units: {
      "Ka (Science)": {
        minSSCgpa: 3.5,
        minHSCgpa: 3.5,
        minTotalGPA: 8.0,
        minSubjectGPA: { Physics: 3.5, Chemistry: 3.5, Math: 3.0 },
        allowedGroups: ["Science"],
        secondTimeAllowed: false,
      },
      "Kha (Arts)": {
        minSSCgpa: 3.0,
        minHSCgpa: 3.0,
        minTotalGPA: 7.5,
        allowedGroups: ["Arts", "Science", "Commerce"],
        secondTimeAllowed: false,
      },
    },
  },
  {
    id: "buet",
    name: "BUET",
    logoId: "inst-buet",
    website: "https://www.buet.ac.bd/",
    applicationDate: "2025-02-10",
    units: {
      Engineering: {
        minSSCgpa: 4.0,
        minHSCgpa: 4.0,
        minTotalGPA: 24, 
        minSubjectGPA: { Physics: 5.0, Chemistry: 5.0, Math: 5.0 },
        allowedGroups: ["Science"],
        secondTimeAllowed: false,
      },
    },
  },
  {
    id: "cu",
    name: "Chittagong University",
    logoId: "inst-cu",
    website: "https://admission.cu.ac.bd/",
    applicationDate: "2025-12-01",
    units: {
      "A Unit (Science)": {
        minSSCgpa: 4.0,
        minHSCgpa: 4.0,
        minTotalGPA: 8.0,
        allowedGroups: ["Science"],
        secondTimeAllowed: true,
      },
      "B Unit (Arts)": {
        minSSCgpa: 3.0,
        minHSCgpa: 3.0,
        minTotalGPA: 7.5,
        allowedGroups: ["Arts", "Science", "Commerce"],
        secondTimeAllowed: true,
      },
    },
  },
  {
    id: "ju",
    name: "Jahangirnagar University",
    logoId: "inst-ju",
    website: "https://ju-admission.org/",
    applicationDate: "2025-11-23",
    units: {
      "A Unit (Math/Phys)": {
        minSSCgpa: 4.0,
        minHSCgpa: 4.0,
        minTotalGPA: 8.5,
        allowedGroups: ["Science"],
        secondTimeAllowed: true,
      },
      "D Unit (Biology)": {
        minSSCgpa: 4.0,
        minHSCgpa: 4.0,
        minTotalGPA: 9.0,
        allowedGroups: ["Science"],
        secondTimeAllowed: true,
      },
    },
  },
  {
    id: "eng-cluster",
    name: "Engineering Cluster (CKRUET)",
    logoId: "inst-eng",
    website: "https://admissionckruet.ac.bd/",
    applicationDate: "2025-12-05",
    units: {
      "KA Group": {
        minSSCgpa: 4.0,
        minHSCgpa: 4.0,
        minTotalGPA: 18.0,
        minSubjectGPA: { Physics: 4.0, Chemistry: 4.0, Math: 4.0 },
        allowedGroups: ["Science"],
        secondTimeAllowed: false,
      },
    },
  },
  {
    id: "agri-cluster",
    name: "Agriculture Cluster (9 Uni)",
    logoId: "inst-agri",
    website: "https://acas.edu.bd/",
    applicationDate: "2025-12-15",
    units: {
      "Science Unit": {
        minSSCgpa: 3.5,
        minHSCgpa: 3.5,
        minTotalGPA: 8.5,
        minSubjectGPA: { Biology: 3.0, Chemistry: 3.0, Physics: 3.0 },
        allowedGroups: ["Science"],
        secondTimeAllowed: true,
      },
    },
  },
  {
    id: "gst",
    name: "GST Cluster (24 Uni)",
    logoId: "inst-gst",
    website: "https://gstadmission.ac.bd/",
    applicationDate: "2025-02-25",
    units: {
      "A Unit (Science)": {
        minSSCgpa: 3.5,
        minHSCgpa: 3.5,
        minTotalGPA: 8.0,
        allowedGroups: ["Science"],
        secondTimeAllowed: true,
      },
      "B Unit (Arts)": {
        minSSCgpa: 3.0,
        minHSCgpa: 3.0,
        minTotalGPA: 6.0,
        allowedGroups: ["Arts"],
        secondTimeAllowed: true,
      },
    },
  },
];