export type Mode = "delay_reverb_comb";
export type Bank = "A" | "B" | "C";

export interface ModeConfig {
  caption: string;
  bit32: {
    inputs: {
      a1: {
        label: string;
        tooltip: string;
      };
      a2: {
        label: string;
        tooltip: string;
      };
    };
    outputs: {
      a1: {
        label: string;
        tooltip: string;
      };
      a2: {
        label: string;
        tooltip: string;
      };
    };
    cv1: {
      label: string;
      tooltip: string;
    };
    cv2: {
      label: string;
      tooltip: string;
    };
    modeLabel: string;
    modeTooltip: string;
    ledLabel: string;
    ledTooltip: string;
  };
  mcc: {
    cv1: {
      label: string;
      tooltip: string;
    };
    cv2: {
      label: string;
      tooltip: string;
    };
    cv3: {
      label: string;
      tooltip: string;
    };
    cv4: {
      label: string;
      tooltip: string;
    };
  };
  bank: Bank;
}

export const MODE_CONFIGS: Record<Mode, ModeConfig> = {
  delay_reverb_comb: {
    caption: "Delay, Reverb & Comb Filter",
    bit32: {
      inputs: {
        a1: {
          label: "DELAY IN",
          tooltip: "Input for delay processing. Accepts audio signal to be delayed.",
        },
        a2: {
          label: "COMB IN",
          tooltip: "Input for comb filter processing. Accepts audio signal for comb filtering.",
        },
      },
      outputs: {
        a1: {
          label: "DELAY OUT",
          tooltip: "Output from delay processing. Delayed audio signal.",
        },
        a2: {
          label: "SCREENS OUT",
          tooltip: "Output for screens/display processing. Processed audio signal.",
        },
      },
      cv1: {
        label: "DELAY AMOUNT",
        tooltip: "Control voltage input 1. Controls the amount of delay applied to the signal.",
      },
      cv2: {
        label: "DECAY FEEDBACK",
        tooltip: "Control voltage input 2. Controls the decay and feedback of the delay effect.",
      },
      modeLabel: "Routes delay output to reverb input",
      modeTooltip: "When active, routes the delay output signal to the reverb input for chained effects processing.",
      ledLabel: "Indicates delay-to-reverb routing is active",
      ledTooltip: "Red LED indicator shows when delay output is routed to reverb input.",
    },
    mcc: {
      cv1: {
        label: "REVERB SIZE",
        tooltip: "MCC Control Voltage 1. Controls the size/spaciousness of the reverb effect.",
      },
      cv2: {
        label: "MIX DECAY/RELEASE",
        tooltip: "MCC Control Voltage 2. Controls the mix between decay and release parameters.",
      },
      cv3: {
        label: "COMB AMOUNT",
        tooltip: "MCC Control Voltage 3. Controls the amount of comb filtering applied.",
      },
      cv4: {
        label: "COMB FEEDBACK",
        tooltip: "MCC Control Voltage 4. Controls the feedback amount in the comb filter.",
      },
    },
    bank: "A",
  },
};
