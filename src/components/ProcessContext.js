import React, { createContext, useContext, useState } from 'react';

const ProcessContext = createContext();

export const ProcessProvider = ({ children }) => {
  const [processes, setProcesses] = useState([
    {
      id: 1,
      name: "Establish service delivery governance and strategies",
      businessCapability: "Deliver Services",
      verified: true,
    },
    {
      id: 2,
      name: "Manage service delivery resources",
      businessCapability: "Deliver Services",
      verified: false,
    },
    {
      id: 3,
      name: "Adjudicate claims and process reimbursement",
      businessCapability: "Deliver Services",
      verified: false,
    },
    {
      id: 4,
      name: "Manage receipt and route of transactions",
      businessCapability: "Deliver Services",
      verified: true,
    },
    {
      id: 5,
      name: "Provide explanation of benefits to members",
      businessCapability: "Deliver Services",
      verified: false,
    },
    {
      id: 6,
      name: "Deliver service to customer",
      businessCapability: "Deliver Services",
      verified: true,
    },
    {
      id: 7,
      name: "Customer Service and Communication",
      businessCapability: "Manage Customer Service",
      verified: true,
    },
    {
      id: 8,
      name: "Post-Delivery Support and Continuous Improvement",
      businessCapability: "Manage Customer Service",
      verified: false,
    },
    {
      id: 9,
      name: "Compliance and Risk Management",
      businessCapability: "Manage Enterprise Risk, Compliance, Remediation, and Resiliency",
      verified: true,
    },
    {
      id: 10,
      name: "Manage health care delivery",
      businessCapability: "Deliver Services",
      verified: false,
    },
    {
      id: 11,
      name: "Support healthcare management",
      businessCapability: "Deliver Services",
      verified: true,
    },
  ]);

  const addProcess = (process) => {
    setProcesses((prev) => [...prev, process]);
  };

  return (
    <ProcessContext.Provider value={{ processes, addProcess }}>
      {children}
    </ProcessContext.Provider>
  );
};

export const useProcesses = () => useContext(ProcessContext);
