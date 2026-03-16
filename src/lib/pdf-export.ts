import type { SaasIdea } from '@/types/database'
import { siteConfig } from '@/lib/site-config'

export async function exportIdeaToPDF(idea: SaasIdea) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let y = 20

  const addNewPageIfNeeded = (requiredSpace: number) => {
    if (y + requiredSpace > 270) {
      doc.addPage()
      y = 20
    }
  }

  const drawSectionHeader = (title: string) => {
    addNewPageIfNeeded(15)
    doc.setFillColor(249, 115, 22) // brand orange
    doc.rect(margin, y, contentWidth, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(title, margin + 3, y + 5.5)
    doc.setTextColor(0, 0, 0)
    y += 12
  }

  const drawKeyValue = (key: string, value: string) => {
    addNewPageIfNeeded(8)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(key + ':', margin, y)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(value, contentWidth - 40)
    doc.text(lines, margin + 40, y)
    y += lines.length * 4.5 + 2
  }

  const drawParagraph = (text: string, fontSize = 9) => {
    addNewPageIfNeeded(10)
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(text, contentWidth)
    doc.text(lines, margin, y)
    y += lines.length * 4 + 4
  }

  const drawBulletList = (items: string[]) => {
    items.forEach(item => {
      addNewPageIfNeeded(8)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      const lines = doc.splitTextToSize(item, contentWidth - 8)
      doc.text('•', margin + 2, y)
      doc.text(lines, margin + 8, y)
      y += lines.length * 4 + 2
    })
    y += 2
  }

  // ====== HEADER ======
  doc.setFillColor(9, 9, 11)
  doc.rect(0, 0, pageWidth, 45, 'F')

  doc.setTextColor(249, 115, 22)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(siteConfig.name, margin, 12)

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  const titleLines = doc.splitTextToSize(idea.title, contentWidth)
  doc.text(titleLines, margin, 22)

  if (idea.tagline) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(200, 200, 200)
    doc.text(idea.tagline, margin, 34)
  }

  doc.setTextColor(0, 0, 0)
  y = 52

  // ====== OVERVIEW ======
  drawSectionHeader('OVERVIEW')
  drawKeyValue('Category', idea.category)
  drawKeyValue('Platform', idea.platform.replace('_', ' '))
  drawKeyValue('Monetization', idea.monetization_model.replace('_', ' '))
  y += 2
  drawParagraph(idea.description)

  // ====== REVENUE ESTIMATES ======
  drawSectionHeader('REVENUE ESTIMATES')
  if (idea.estimated_mrr_low && idea.estimated_mrr_high) {
    drawKeyValue('Estimated MRR', `$${idea.estimated_mrr_low.toLocaleString()} - $${idea.estimated_mrr_high.toLocaleString()}`)
  }
  if (idea.estimated_daily_sales) drawKeyValue('Daily Sales', `$${idea.estimated_daily_sales.toLocaleString()}`)
  if (idea.estimated_monthly_sales) drawKeyValue('Monthly Sales', `$${idea.estimated_monthly_sales.toLocaleString()}`)

  if (idea.revenue_breakdown) {
    const rb = idea.revenue_breakdown
    if (rb.primary_revenue) drawKeyValue('Primary Revenue', rb.primary_revenue)
    if (rb.secondary_revenue) drawKeyValue('Secondary Revenue', rb.secondary_revenue)
    if (rb.free_trial_conversion_rate) drawKeyValue('Trial Conversion', `${rb.free_trial_conversion_rate}%`)
    if (rb.customer_acquisition_cost) drawKeyValue('CAC', `$${rb.customer_acquisition_cost}`)
    if (rb.lifetime_value) drawKeyValue('LTV', `$${rb.lifetime_value}`)
    if (rb.average_customer_lifetime_months) drawKeyValue('Avg Lifetime', `${rb.average_customer_lifetime_months} months`)
  }

  // ====== PRICING TIERS ======
  if (idea.pricing_tiers && idea.pricing_tiers.length > 0) {
    drawSectionHeader('PRICING TIERS')
    addNewPageIfNeeded(30)
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Tier', 'Price', 'Billing', 'Features']],
      body: idea.pricing_tiers.map(t => [
        t.name,
        `$${t.price}`,
        t.billing,
        t.features.join(', '),
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [249, 115, 22], textColor: 255 },
      columnStyles: { 3: { cellWidth: 70 } },
    })
    y = (doc as any).lastAutoTable.finalY + 6
  }

  // ====== TECH STACK ======
  if (idea.tech_stack) {
    drawSectionHeader('TECH STACK')
    const ts = idea.tech_stack
    if (ts.frontend?.length) drawKeyValue('Frontend', ts.frontend.join(', '))
    if (ts.backend?.length) drawKeyValue('Backend', ts.backend.join(', '))
    if (ts.database?.length) drawKeyValue('Database', ts.database.join(', '))
    if (ts.hosting?.length) drawKeyValue('Hosting', ts.hosting.join(', '))
    if (ts.ai_ml?.length) drawKeyValue('AI/ML', ts.ai_ml.join(', '))
    if (ts.other?.length) drawKeyValue('Other', ts.other.join(', '))
  }

  // ====== TEAM ROLES ======
  if (idea.team_roles && idea.team_roles.length > 0) {
    drawSectionHeader('TEAM STRUCTURE')
    addNewPageIfNeeded(30)
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Role', 'Priority', 'Skills Needed', 'Responsibilities']],
      body: idea.team_roles.map(r => [
        r.role,
        r.priority.replace('_', ' '),
        r.skills_needed.join(', '),
        r.responsibilities.join(', '),
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [249, 115, 22], textColor: 255 },
    })
    y = (doc as any).lastAutoTable.finalY + 6
  }

  // ====== MARKETING STRATEGY ======
  if (idea.marketing_strategy) {
    drawSectionHeader('MARKETING STRATEGY')
    const ms = idea.marketing_strategy
    if (ms.channels?.length) { drawKeyValue('Channels', ''); drawBulletList(ms.channels) }
    if (ms.content_strategy?.length) { drawKeyValue('Content Strategy', ''); drawBulletList(ms.content_strategy) }
    if (ms.paid_advertising?.length) { drawKeyValue('Paid Advertising', ''); drawBulletList(ms.paid_advertising) }
    if (ms.partnerships?.length) { drawKeyValue('Partnerships', ''); drawBulletList(ms.partnerships) }
    if (ms.launch_strategy) drawKeyValue('Launch Strategy', ms.launch_strategy)
  }

  // ====== LEAD GENERATION ======
  if (idea.lead_generation) {
    drawSectionHeader('LEAD GENERATION')
    const lg = idea.lead_generation
    if (lg.channels?.length) { drawKeyValue('Channels', ''); drawBulletList(lg.channels) }
    if (lg.strategies?.length) { drawKeyValue('Strategies', ''); drawBulletList(lg.strategies) }
    if (lg.estimated_cost_per_lead) drawKeyValue('Cost per Lead', `$${lg.estimated_cost_per_lead}`)
    if (lg.conversion_funnel?.length) { drawKeyValue('Conversion Funnel', ''); drawBulletList(lg.conversion_funnel) }
  }

  // ====== SEO STRATEGY ======
  if (idea.seo_strategy) {
    drawSectionHeader('SEO STRATEGY')
    const seo = idea.seo_strategy
    if (seo.target_keywords?.length) { drawKeyValue('Target Keywords', ''); drawBulletList(seo.target_keywords) }
    if (seo.content_plan?.length) { drawKeyValue('Content Plan', ''); drawBulletList(seo.content_plan) }
    if (seo.technical_seo?.length) { drawKeyValue('Technical SEO', ''); drawBulletList(seo.technical_seo) }
    if (seo.estimated_organic_traffic_monthly) drawKeyValue('Est. Monthly Traffic', seo.estimated_organic_traffic_monthly.toLocaleString())
  }

  // ====== COMPETITION ======
  if (idea.existing_competitors && idea.existing_competitors.length > 0) {
    drawSectionHeader('COMPETITIVE ANALYSIS')
    addNewPageIfNeeded(30)
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Competitor', 'URL', 'Weakness', 'Our Advantage']],
      body: idea.existing_competitors.map(c => [
        c.name,
        c.url || '-',
        c.weakness || '-',
        c.our_advantage || '-',
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [249, 115, 22], textColor: 255 },
    })
    y = (doc as any).lastAutoTable.finalY + 6
  }

  // ====== PROS & CONS ======
  if (idea.pros?.length || idea.cons?.length) {
    drawSectionHeader('PROS & CONS')
    if (idea.pros?.length) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(16, 185, 129) // emerald
      doc.text('Pros:', margin, y)
      y += 5
      doc.setTextColor(0, 0, 0)
      drawBulletList(idea.pros)
    }
    if (idea.cons?.length) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(239, 68, 68) // rose
      doc.text('Cons:', margin, y)
      y += 5
      doc.setTextColor(0, 0, 0)
      drawBulletList(idea.cons)
    }
  }

  // ====== UNIQUE DIFFERENTIATORS ======
  if (idea.unique_differentiators?.length) {
    drawSectionHeader('UNIQUE DIFFERENTIATORS')
    drawBulletList(idea.unique_differentiators)
  }

  // ====== FOOTER ======
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Generated by ${siteConfig.name}  |  Page ${i} of ${pageCount}  |  ${new Date().toLocaleDateString()}`,
      pageWidth / 2,
      290,
      { align: 'center' }
    )
  }

  // Save
  const slug = idea.slug || idea.id
  doc.save(`${siteConfig.mode === 'full' ? 'openprojectidea' : 'opensaasidea'}-${slug}.pdf`)
}
