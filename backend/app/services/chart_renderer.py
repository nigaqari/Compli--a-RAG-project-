import io
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

# Compli Brand Palette
COLOR_HIGH = '#DC2626'    # Red
COLOR_MED = '#D97706'     # Amber
COLOR_LOW = '#16A34A'     # Green
COLOR_DARK = '#0F172A'    # Dark Slate
COLOR_BG = '#F8FAFC'      # Light Slate Background

def render_risk_breakdown_donut(high: int, medium: int, low: int) -> bytes:
    """Renders a polished donut chart of risk severity distribution."""
    total = high + medium + low
    if total == 0:
        values = [1]
        colors = ['#94A3B8']
        labels = ['No Risks']
    else:
        values = []
        colors = []
        labels = []
        if high > 0:
            values.append(high)
            colors.append(COLOR_HIGH)
            labels.append(f'High ({high})')
        if medium > 0:
            values.append(medium)
            colors.append(COLOR_MED)
            labels.append(f'Medium ({medium})')
        if low > 0:
            values.append(low)
            colors.append(COLOR_LOW)
            labels.append(f'Low ({low})')

    fig, ax = plt.subplots(figsize=(4.5, 3.2), dpi=150)
    fig.patch.set_facecolor('white')
    ax.set_facecolor('white')

    if total > 0:
        wedges, texts, autotexts = ax.pie(
            values,
            labels=labels,
            colors=colors,
            autopct='%1.0f%%',
            pctdistance=0.75,
            startangle=90,
            wedgeprops=dict(width=0.4, edgecolor='white', linewidth=2)
        )
        for t in texts:
            t.set_fontsize(8)
            t.set_fontweight('bold')
            t.set_color(COLOR_DARK)
        for at in autotexts:
            at.set_fontsize(8)
            at.set_color('white')
            at.set_fontweight('bold')
    else:
        wedges, texts = ax.pie(
            values,
            labels=labels,
            colors=colors,
            pctdistance=0.75,
            startangle=90,
            wedgeprops=dict(width=0.4, edgecolor='white', linewidth=2)
        )
        for t in texts:
            t.set_fontsize(8)
            t.set_color('#64748B')

    ax.set_title('Risk Breakdown by Severity', fontsize=10, fontweight='bold', color=COLOR_DARK, pad=10)
    plt.tight_layout()

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor='white')
    plt.close(fig)
    buf.seek(0)
    return buf.getvalue()

def render_compliance_score_gauge(score: float) -> bytes:
    """Renders a modern half-donut gauge chart representing the compliance score (0-100)."""
    score = max(0.0, min(100.0, float(score)))

    if score >= 75:
        score_color = COLOR_LOW
        status_text = "Compliant"
    elif score >= 50:
        score_color = COLOR_MED
        status_text = "Needs Review"
    else:
        score_color = COLOR_HIGH
        status_text = "High Risk"

    fig, ax = plt.subplots(figsize=(4.5, 2.8), dpi=150, subplot_kw={'projection': 'polar'})
    fig.patch.set_facecolor('white')
    ax.set_facecolor('white')

    # Half circle gauge from 0 to pi (180 deg)
    val_rad = (score / 100.0) * np.pi
    remainder_rad = np.pi - val_rad

    # Background track
    ax.barh([1], [np.pi], left=[0], height=0.35, color='#E2E8F0', align='center')
    # Score bar
    if score > 0:
        ax.barh([1], [val_rad], left=[0], height=0.35, color=score_color, align='center')

    ax.set_theta_zero_location('W')
    ax.set_theta_direction(-1)
    ax.set_thetamin(0)
    ax.set_thetamax(180)

    ax.set_rticks([])
    ax.set_xticks([])
    ax.grid(False)
    ax.spines['polar'].set_visible(False)

    # Score Text in center
    plt.text(0, 0, f"{int(score)}%", ha='center', va='center', fontsize=22, fontweight='bold', color=score_color)
    plt.text(0, -0.35, status_text, ha='center', va='center', fontsize=10, fontweight='bold', color='#64748B')
    plt.title('Overall Compliance Score', fontsize=10, fontweight='bold', color=COLOR_DARK, pad=12)

    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor='white')
    plt.close(fig)
    buf.seek(0)
    return buf.getvalue()
