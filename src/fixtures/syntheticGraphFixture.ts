import type { ElementsDefinition } from 'cytoscape';

/**
 * SYNTHETIC DEVELOPMENT FIXTURE
 * 
 * IMPORTANT: This data is purely synthetic and intended strictly for 
 * frontend canvas layout, styling, and interaction development. 
 * None of the nodes or edges below represent real Bitcoin transactions.
 */
export const SYNTHETIC_GRAPH_FIXTURE: ElementsDefinition = {
  nodes: [
    // Source deposits / Inflow layer (Timestep 1)
    {
      data: {
        id: 'SYNTH-TX-01',
        label: 'licit',
        timestep: 1,
        synthetic: true,
        note: 'Synthetic deposit from exchange address',
        amountBtc: 4.85,
      },
    },
    {
      data: {
        id: 'SYNTH-TX-02',
        label: 'licit',
        timestep: 1,
        synthetic: true,
        note: 'Synthetic merchant settlement transaction',
        amountBtc: 12.30,
      },
    },
    {
      data: {
        id: 'SYNTH-TX-03',
        label: 'unknown',
        timestep: 1,
        synthetic: true,
        note: 'Synthetic unclassified origin payment',
        amountBtc: 7.20,
      },
    },

    // Aggregation & Relay layer (Timestep 2)
    {
      data: {
        id: 'SYNTH-TX-04',
        label: 'licit',
        timestep: 2,
        synthetic: true,
        note: 'Synthetic multi-input payment aggregator',
        amountBtc: 16.50,
      },
    },
    {
      data: {
        id: 'SYNTH-TX-05',
        label: 'licit',
        timestep: 2,
        synthetic: true,
        note: 'Synthetic standard custody transfer',
        amountBtc: 3.10,
      },
    },
    {
      data: {
        id: 'SYNTH-TX-06',
        label: 'unknown',
        timestep: 2,
        synthetic: true,
        note: 'Synthetic unverified intermediary node',
        amountBtc: 6.90,
      },
    },
    {
      data: {
        id: 'SYNTH-TX-07',
        label: 'unknown',
        timestep: 2,
        synthetic: true,
        note: 'Synthetic unverified pass-through address',
        amountBtc: 2.45,
      },
    },

    // Suspicious pattern / Illicit cluster (Timestep 3)
    {
      data: {
        id: 'SYNTH-TX-08',
        label: 'illicit',
        timestep: 3,
        synthetic: true,
        note: 'Illustrative illicit: synthetic ransomware split',
        amountBtc: 5.80,
      },
    },
    {
      data: {
        id: 'SYNTH-TX-09',
        label: 'illicit',
        timestep: 3,
        synthetic: true,
        note: 'Illustrative illicit: synthetic peel-chain hop A',
        amountBtc: 4.90,
      },
    },
    {
      data: {
        id: 'SYNTH-TX-10',
        label: 'illicit',
        timestep: 3,
        synthetic: true,
        note: 'Illustrative illicit: synthetic peel-chain hop B',
        amountBtc: 4.10,
      },
    },
    {
      data: {
        id: 'SYNTH-TX-11',
        label: 'illicit',
        timestep: 3,
        synthetic: true,
        note: 'Illustrative illicit: synthetic darknet vendor transfer',
        amountBtc: 1.85,
      },
    },
    {
      data: {
        id: 'SYNTH-TX-12',
        label: 'illicit',
        timestep: 3,
        synthetic: true,
        note: 'Illustrative illicit: synthetic mixing distribution input',
        amountBtc: 3.25,
      },
    },

    // Layering & Splitting layer (Timestep 4)
    {
      data: {
        id: 'SYNTH-TX-13',
        label: 'illicit',
        timestep: 4,
        synthetic: true,
        note: 'Illustrative illicit: synthetic layering aggregator',
        amountBtc: 6.70,
      },
    },
    {
      data: {
        id: 'SYNTH-TX-14',
        label: 'illicit',
        timestep: 4,
        synthetic: true,
        note: 'Illustrative illicit: synthetic high-frequency split',
        amountBtc: 2.10,
      },
    },
    {
      data: {
        id: 'SYNTH-TX-15',
        label: 'unknown',
        timestep: 4,
        synthetic: true,
        note: 'Synthetic unlabelled change output',
        amountBtc: 0.95,
      },
    },
    {
      data: {
        id: 'SYNTH-TX-16',
        label: 'unknown',
        timestep: 4,
        synthetic: true,
        note: 'Synthetic unlabelled multi-sig branch',
        amountBtc: 1.40,
      },
    },

    // Output / Sinks (Timestep 5)
    {
      data: {
        id: 'SYNTH-TX-17',
        label: 'unknown',
        timestep: 5,
        synthetic: true,
        note: 'Synthetic unlabelled cash-out attempt',
        amountBtc: 2.90,
      },
    },
    {
      data: {
        id: 'SYNTH-TX-18',
        label: 'licit',
        timestep: 5,
        synthetic: true,
        note: 'Synthetic legitimate cold storage vault',
        amountBtc: 8.50,
      },
    },
    {
      data: {
        id: 'SYNTH-TX-19',
        label: 'licit',
        timestep: 5,
        synthetic: true,
        note: 'Synthetic regulated exchange deposit',
        amountBtc: 5.60,
      },
    },
    {
      data: {
        id: 'SYNTH-TX-20',
        label: 'licit',
        timestep: 5,
        synthetic: true,
        note: 'Synthetic verified retail merchant payment',
        amountBtc: 1.15,
      },
    },
  ],

  edges: [
    // Timestep 1 -> Timestep 2
    { data: { id: 'SYNTH-E-01', source: 'SYNTH-TX-01', target: 'SYNTH-TX-04', synthetic: true, amountBtc: 4.80 } },
    { data: { id: 'SYNTH-E-02', source: 'SYNTH-TX-02', target: 'SYNTH-TX-04', synthetic: true, amountBtc: 11.70 } },
    { data: { id: 'SYNTH-E-03', source: 'SYNTH-TX-02', target: 'SYNTH-TX-05', synthetic: true, amountBtc: 0.50 } },
    { data: { id: 'SYNTH-E-04', source: 'SYNTH-TX-03', target: 'SYNTH-TX-06', synthetic: true, amountBtc: 4.50 } },
    { data: { id: 'SYNTH-E-05', source: 'SYNTH-TX-03', target: 'SYNTH-TX-07', synthetic: true, amountBtc: 2.60 } },

    // Timestep 2 -> Timestep 3
    { data: { id: 'SYNTH-E-06', source: 'SYNTH-TX-04', target: 'SYNTH-TX-18', synthetic: true, amountBtc: 8.50 } },
    { data: { id: 'SYNTH-E-07', source: 'SYNTH-TX-04', target: 'SYNTH-TX-06', synthetic: true, amountBtc: 7.90 } },
    { data: { id: 'SYNTH-E-08', source: 'SYNTH-TX-05', target: 'SYNTH-TX-19', synthetic: true, amountBtc: 3.05 } },
    { data: { id: 'SYNTH-E-09', source: 'SYNTH-TX-06', target: 'SYNTH-TX-08', synthetic: true, amountBtc: 5.85 } },
    { data: { id: 'SYNTH-E-10', source: 'SYNTH-TX-06', target: 'SYNTH-TX-12', synthetic: true, amountBtc: 3.30 } },
    { data: { id: 'SYNTH-E-11', source: 'SYNTH-TX-07', target: 'SYNTH-TX-11', synthetic: true, amountBtc: 1.90 } },
    { data: { id: 'SYNTH-E-12', source: 'SYNTH-TX-07', target: 'SYNTH-TX-15', synthetic: true, amountBtc: 0.50 } },

    // Peel chain & illicit propagation (Timestep 3)
    { data: { id: 'SYNTH-E-13', source: 'SYNTH-TX-08', target: 'SYNTH-TX-09', synthetic: true, amountBtc: 4.95 } },
    { data: { id: 'SYNTH-E-14', source: 'SYNTH-TX-08', target: 'SYNTH-TX-15', synthetic: true, amountBtc: 0.80 } },
    { data: { id: 'SYNTH-E-15', source: 'SYNTH-TX-09', target: 'SYNTH-TX-10', synthetic: true, amountBtc: 4.15 } },
    { data: { id: 'SYNTH-E-16', source: 'SYNTH-TX-09', target: 'SYNTH-TX-14', synthetic: true, amountBtc: 0.75 } },
    { data: { id: 'SYNTH-E-17', source: 'SYNTH-TX-10', target: 'SYNTH-TX-13', synthetic: true, amountBtc: 3.40 } },
    { data: { id: 'SYNTH-E-18', source: 'SYNTH-TX-10', target: 'SYNTH-TX-16', synthetic: true, amountBtc: 0.70 } },
    { data: { id: 'SYNTH-E-19', source: 'SYNTH-TX-11', target: 'SYNTH-TX-13', synthetic: true, amountBtc: 1.80 } },
    { data: { id: 'SYNTH-E-20', source: 'SYNTH-TX-12', target: 'SYNTH-TX-13', synthetic: true, amountBtc: 3.20 } },

    // Layering -> Sinks (Timestep 4 -> Timestep 5)
    { data: { id: 'SYNTH-E-21', source: 'SYNTH-TX-13', target: 'SYNTH-TX-17', synthetic: true, amountBtc: 2.95 } },
    { data: { id: 'SYNTH-E-22', source: 'SYNTH-TX-13', target: 'SYNTH-TX-19', synthetic: true, amountBtc: 2.55 } },
    { data: { id: 'SYNTH-E-23', source: 'SYNTH-TX-14', target: 'SYNTH-TX-17', synthetic: true, amountBtc: 1.30 } },
    { data: { id: 'SYNTH-E-24', source: 'SYNTH-TX-14', target: 'SYNTH-TX-20', synthetic: true, amountBtc: 0.75 } },
    { data: { id: 'SYNTH-E-25', source: 'SYNTH-TX-15', target: 'SYNTH-TX-16', synthetic: true, amountBtc: 0.90 } },
    { data: { id: 'SYNTH-E-26', source: 'SYNTH-TX-16', target: 'SYNTH-TX-20', synthetic: true, amountBtc: 0.40 } },
  ],
};
