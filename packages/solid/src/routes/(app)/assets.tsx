import { Title } from "@solidjs/meta"
import { ConnectGate } from "~/components/shared/ConnectGate"
import { StubBanner } from "~/components/site/StubBanner"
import { Card } from "~/components/ui/Card"
import { SectionTitle } from "~/components/ui/SectionTitle"
import { StatTile } from "~/components/ui/StatTile"
import { useT } from "~/lib/i18n"

export default function AssetsPage() {
  const tr = useT()
  return (
    <>
      <Title>
        {tr("nav.assets")} · {tr("app.name")}
      </Title>
      <div class="mx-auto max-w-lg space-y-4 px-4 py-5 pb-24">
        <div>
          <h1 class="text-xl font-bold text-ink-1">{tr("assets.title")}</h1>
          <p class="mt-1 text-sm text-ink-2">{tr("assets.lead")}</p>
        </div>
        <StubBanner />
        <ConnectGate />

        <div class="grid grid-cols-2 gap-2">
          <StatTile label={tr("assets.native")} value="—" tone="primary" />
          <StatTile label={tr("assets.token")} value="—" />
          <StatTile label={tr("assets.locked")} value="—" tone="warn" />
          <StatTile label={tr("assets.claimable")} value="—" tone="ok" />
        </div>

        <Card class="space-y-2 p-4">
          <SectionTitle title={tr("assets.positions")} />
          <p class="text-sm text-ink-3">{tr("assets.empty")}</p>
        </Card>
      </div>
    </>
  )
}
