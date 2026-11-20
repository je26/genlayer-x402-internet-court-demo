import {
  AbsoluteFill,
  Composition,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";

const FPS = 30;
const W = 720;
const H = 1280;

// ---- palette (matches the demo frontend) ----
const BG = "#0a0f1e";
const PANEL = "#111a2e";
const LINE = "#22304d";
const GOLD = "#d4af37";
const GOLD2 = "#f0c75e";
const TEAL = "#2dd4bf";
const RED = "#f87171";
const GREEN = "#4ade80";
const TEXT = "#e8edf7";
const MUTED = "#93a1bd";
const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";
const SANS = "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif";

const VERDICT =
  "\u201CThe buyer provided clear evidence that the seller never sent the promised 10-page report or any delivery link after payment, with three days having passed. The funds should therefore be refunded to the buyer.\u201D";
const CONTRACT = "0x072a9e7c549C81f64FBE96990eB122DCd85E18b0";
const ADJUDICATE_TX = "0xc1d473f463ac34ef90186ce1b4c04a657b9aec4dea9cfadfcda4e3933d3321ac";

// ---------- helpers ----------
const Fade: React.FC<{
  from?: number;
  dur?: number;
  children: React.ReactNode;
  y?: number;
}> = ({ from = 0, dur = 12, children, y = 26 }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        opacity: interpolate(frame, [from, from + dur], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        transform: `translateY(${interpolate(frame, [from, from + dur], [y, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}px)`,
      }}
    >
      {children}
    </div>
  );
};

const LogoRow: React.FC<{ scale?: number }> = ({ scale = 1 }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 22 * scale,
    }}
  >
    <Img
      src={staticFile("genlayer-logo.svg")}
      style={{ height: 30 * scale, filter: "invert(1)" }}
    />
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7 * scale,
        border: `1px solid ${LINE}`,
        background: "#101c33",
        borderRadius: 9,
        padding: `${6 * scale}px ${12 * scale}px`,
        fontFamily: SANS,
        fontWeight: 800,
        fontSize: 15 * scale,
        letterSpacing: "0.04em",
        color: TEXT,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontSize: 18 * scale }}>⚖️</span> Internet Court
    </div>
    <Img
      src={staticFile("x402-logo.svg")}
      style={{ height: 30 * scale, filter: "invert(1)" }}
    />
  </div>
);

const Scene: React.FC<{
  children: React.ReactNode;
  bg?: string;
}> = ({ children, bg = BG }) => (
  <AbsoluteFill style={{ backgroundColor: bg }}>
    <div
      style={{
        position: "absolute",
        left: 44,
        right: 44,
        top: 90,
        bottom: 90,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {children}
    </div>
  </AbsoluteFill>
);

const Kicker: React.FC<{ children: React.ReactNode; color?: string }> = ({
  children,
  color = GOLD2,
}) => (
  <div
    style={{
      fontFamily: MONO,
      fontSize: 17,
      fontWeight: 700,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color,
      marginBottom: 18,
    }}
  >
    {children}
  </div>
);

const Big: React.FC<{ children: React.ReactNode; size?: number; color?: string }> = ({
  children,
  size = 62,
  color = TEXT,
}) => (
  <div
    style={{
      fontFamily: SANS,
      fontWeight: 900,
      fontSize: size,
      lineHeight: 1.04,
      letterSpacing: -1.5,
      color,
    }}
  >
    {children}
  </div>
);

const Body: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      fontFamily: SANS,
      fontSize: 22,
      lineHeight: 1.45,
      color: MUTED,
      marginTop: 16,
    }}
  >
    {children}
  </div>
);

const Card: React.FC<{ children: React.ReactNode; accent?: string }> = ({
  children,
  accent = GOLD,
}) => (
  <div
    style={{
      background: PANEL,
      border: `1px solid ${LINE}`,
      borderLeft: `5px solid ${accent}`,
      borderRadius: 14,
      padding: "20px 22px",
      marginTop: 26,
    }}
  >
    {children}
  </div>
);

// ---------- scenes ----------
const Hook: React.FC = () => (
  <Scene>
    <Fade from={0}>
      <Kicker>GenLayer × x402 × Internet Court</Kicker>
    </Fade>
    <Fade from={8}>
      <Big size={76}>AGENTS PAY.</Big>
    </Fade>
    <Fade from={18}>
      <Big size={76} color={GOLD2}>
        THE COURT
      </Big>
    </Fade>
    <Fade from={28}>
      <Big size={76}>DECIDES.</Big>
    </Fade>
    <Fade from={44} y={10}>
      <div
        style={{
          fontFamily: SANS,
          fontSize: 30,
          fontWeight: 800,
          color: TEXT,
          marginTop: 26,
        }}
      >
        Pay &amp; Prove
      </div>
      <div style={{ fontFamily: SANS, fontSize: 20, color: MUTED, marginTop: 6 }}>
        An x402 payment, held in a GenLayer escrow, judged by the Internet Court.
      </div>
    </Fade>
    <Fade from={58} y={10}>
      <div style={{ marginTop: 44 }}>
        <LogoRow scale={0.92} />
      </div>
    </Fade>
  </Scene>
);

const Problem: React.FC = () => (
  <Scene>
    <Fade from={0}>
      <Kicker color={RED}>The problem</Kicker>
    </Fade>
    <Fade from={8}>
      <Big size={56}>An AI agent pays for work.</Big>
    </Fade>
    <Fade from={20}>
      <Big size={56} color={RED}>
        The seller vanishes.
      </Big>
    </Fade>
    <Fade from={34}>
      <Body>
        No delivery. No reply. No refund button. In the agentic economy, who
        makes the buyer whole?
      </Body>
    </Fade>
    <Fade from={48} y={10}>
      <Card accent={RED}>
        <div style={{ fontFamily: MONO, fontSize: 19, color: TEXT }}>
          buyer 0x1789…bf33 → seller 0x8ae5…c8b
        </div>
        <div style={{ fontFamily: MONO, fontSize: 19, color: RED, marginTop: 6 }}>
          0.05 GEN · paid · nothing delivered
        </div>
      </Card>
    </Fade>
  </Scene>
);

const Pay: React.FC = () => (
  <Scene>
    <Fade from={0}>
      <Kicker color={TEAL}>Step 1 · x402 payment</Kicker>
    </Fade>
    <Fade from={8}>
      <Big size={56}>402 Payment Required</Big>
    </Fade>
    <Fade from={20}>
      <Body>
        The seller answers with an x402 payment demand. The buyer pays — but
        the funds do <b style={{ color: TEXT }}>not</b> go to the seller. They
        lock in escrow.
      </Body>
    </Fade>
    <Fade from={34} y={10}>
      <Card accent={TEAL}>
        <div style={{ fontFamily: MONO, fontSize: 20, color: TEXT, lineHeight: 1.7 }}>
          buyer ── 0.05 GEN ──▶ escrow
          <br />
          <span style={{ color: MUTED }}>seller gets paid only if it delivers</span>
        </div>
      </Card>
    </Fade>
    <Fade from={48} y={10}>
      <div style={{ marginTop: 30, display: "flex", justifyContent: "center" }}>
        <Img src={staticFile("x402-logo.svg")} style={{ height: 40, filter: "invert(1)" }} />
      </div>
    </Fade>
  </Scene>
);

const Escrow: React.FC = () => (
  <Scene>
    <Fade from={0}>
      <Kicker>Step 2 · GenLayer escrow</Kicker>
    </Fade>
    <Fade from={8}>
      <Big size={56}>Funds lock in an intelligent contract.</Big>
    </Fade>
    <Fade from={20}>
      <Body>
        <b style={{ color: TEXT }}>PayProveEscrow</b> holds the money and the
        deal facts on GenLayer Studio Next — chain 61997.
      </Body>
    </Fade>
    <Fade from={34} y={10}>
      <Card>
        <div style={{ fontFamily: MONO, fontSize: 16, color: GOLD2, wordBreak: "break-all", lineHeight: 1.6 }}>
          {CONTRACT}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 17, color: MUTED, marginTop: 10 }}>
          deal-001 · “AI market-research report” · 0.05 GEN
        </div>
        <div style={{ fontFamily: MONO, fontSize: 17, color: GREEN, marginTop: 6 }}>
          status: created
        </div>
      </Card>
    </Fade>
  </Scene>
);

const Dispute: React.FC = () => (
  <Scene>
    <Fade from={0}>
      <Kicker color={RED}>Step 3 · Dispute</Kicker>
    </Fade>
    <Fade from={8}>
      <Big size={56}>Three days. Nothing delivered.</Big>
    </Fade>
    <Fade from={20}>
      <Body>The buyer calls dispute() and states the case.</Body>
    </Fade>
    <Fade from={32} y={10}>
      <Card accent={RED}>
        <div style={{ fontFamily: SANS, fontSize: 21, lineHeight: 1.5, color: TEXT, fontStyle: "italic" }}>
          “The seller never sent the report. No file, no link, no message after
          payment. Three days passed and nothing was delivered.”
        </div>
        <div style={{ fontFamily: MONO, fontSize: 17, color: RED, marginTop: 12 }}>
          status: disputed
        </div>
      </Card>
    </Fade>
  </Scene>
);

const Verdict: React.FC = () => (
  <Scene>
    <Fade from={0}>
      <Kicker>Step 4 · Internet Court adjudicates</Kicker>
    </Fade>
    <Fade from={8}>
      <Big size={52}>LLM consensus judges the deal.</Big>
    </Fade>
    <Fade from={20}>
      <Body>
        A leader proposes a verdict. Validators independently re-judge. The
        agreed verdict executes on-chain.
      </Body>
    </Fade>
    <Fade from={32} y={10}>
      <Card accent={GOLD}>
        <div style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, letterSpacing: "0.1em", color: GOLD2, marginBottom: 8 }}>
          ⚖ INTERNET COURT VERDICT — ON-CHAIN
        </div>
        <div style={{ fontFamily: SANS, fontSize: 19, lineHeight: 1.5, color: TEXT }}>
          {VERDICT}
        </div>
        <div
          style={{
            display: "inline-block",
            marginTop: 14,
            fontFamily: SANS,
            fontSize: 20,
            fontWeight: 900,
            color: "#fca5a5",
            background: "#3a1420",
            border: "1px solid #7f1d2e",
            borderRadius: 999,
            padding: "6px 18px",
          }}
        >
          REFUNDED
        </div>
      </Card>
    </Fade>
  </Scene>
);

const Proof: React.FC = () => (
  <Scene>
    <Fade from={0}>
      <Kicker color={GREEN}>Verified, not mocked</Kicker>
    </Fade>
    <Fade from={8}>
      <Big size={52}>Real contract. Real verdict. Real tx.</Big>
    </Fade>
    <Fade from={20}>
      <Card accent={GREEN}>
        <div style={{ fontFamily: MONO, fontSize: 15, color: MUTED, lineHeight: 1.8 }}>
          adjudicate tx
          <br />
          <span style={{ color: GOLD2, wordBreak: "break-all" }}>{ADJUDICATE_TX}</span>
          <br />
          explorer-studio-dev.genlayer.com
        </div>
      </Card>
    </Fade>
    <Fade from={34} y={10}>
      <div style={{ marginTop: 30 }}>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 26,
            fontWeight: 800,
            color: TEXT,
            textAlign: "center",
          }}
        >
          Pay &amp; Prove
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 17,
            color: MUTED,
            textAlign: "center",
            marginTop: 6,
          }}
        >
          github.com/je26/genlayer-x402-internet-court-demo
        </div>
      </div>
    </Fade>
    <Fade from={46} y={10}>
      <div style={{ marginTop: 34 }}>
        <LogoRow scale={0.85} />
      </div>
    </Fade>
  </Scene>
);

// ---------- root ----------
const PayProveVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <Sequence from={0} durationInFrames={150}>
        <Hook />
      </Sequence>
      <Sequence from={150} durationInFrames={180}>
        <Problem />
      </Sequence>
      <Sequence from={330} durationInFrames={180}>
        <Pay />
      </Sequence>
      <Sequence from={510} durationInFrames={180}>
        <Escrow />
      </Sequence>
      <Sequence from={690} durationInFrames={180}>
        <Dispute />
      </Sequence>
      <Sequence from={870} durationInFrames={210}>
        <Verdict />
      </Sequence>
      <Sequence from={1080} durationInFrames={180}>
        <Proof />
      </Sequence>
    </AbsoluteFill>
  );
};

export const PayProveComposition = () => {
  return (
    <Composition
      id="PayProve"
      component={PayProveVideo}
      durationInFrames={1260}
      fps={FPS}
      width={W}
      height={H}
    />
  );
};
