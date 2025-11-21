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
          label: "DELAY/REVERB IN",
          tooltip: "Audio input for both the Delay & Reverb processors.",
        },
        a2: {
          label: "COMB IN",
          tooltip: "Audio input for the Comb Filter.",
        },
      },
      outputs: {
        a1: {
          label: "DELAY/REVERB OUT",
          tooltip: "Audio output of Delay & Reverb mixed according to MCC CV2. This is the 100% wet signal.",
        },
        a2: {
          label: "COMB OUT",
          tooltip: "Audio output of the Comb Filter. This is the 100% wet signal.",
        },
      },
      cv1: {
        label: "DELAY LENGTH",
        tooltip: "Controls the delay length from 0 to 1/2 beat. Synced to the MIDI tempo.",
      },
      cv2: {
        label: "DELAY FEEDBACK",
        tooltip: "Controls the feedback amount for the delay. Range: 0 to 1.",
      },
      modeLabel: "Feed Delay to Reverb",
      modeTooltip: "Routes the Delay output to the Reverb processor along with the input from A1.",
      ledLabel: "Indicates Delay to Reverb",
      ledTooltip: "Red LED indicates whether Delay to Reverb is turned on or off.",
    },
    mcc: {
      cv1: {
        label: "REVERB SIZE",
        tooltip: "Controls Reverb Size. Similar to Room Size, it controls the RT60 (reverb time) amount.",
      },
      cv2: {
        label: "DELAY/REVERB MIX",
        tooltip: "Determines the Delay & Reverb mix for Output A1. Center position mixes both equally. Turning clockwise mixes more Reverb, and turning counter-clockwise adds more Delay.",
      },
      cv3: {
        label: "COMB LENGTH",
        tooltip: "Controls the delay length from 1ms to 50ms.",
      },
      cv4: {
        label: "COMB FEEDBACK",
        tooltip: "Controls the comb filter feedback amount. Range: 0 to 1.",
      },
    },
    bank: "A",
  },
};
