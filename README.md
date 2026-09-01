# GTOMaxy
# Poker GTO Preflop Trainer

A modern, interactive web-based poker training tool for mastering game theory optimal (GTO) preflop strategy. Train against real GTO ranges, learn optimal opening ranges, and improve your poker fundamentals.

## 🎯 Features

### Current (v1.0)
- **Interactive Poker Table** - Visual 6-max table with player positions clearly labeled
- **Preflop Range Trainer** - Practice decision-making from every position
- **GTO Guidance** - Real-time percentage recommendations based on proven GTO strategies
- **Action Buttons** - Fold, Call, Raise with intelligent feedback
- **Position Learning** - Train for Early Position (EP), Middle Position (MP), Cutoff (CO), Button (BTN), and Blinds
- **Hand History** - Review your recent decisions and GTO comparisons
- **Mobile Responsive** - Practice on desktop or tablet

### Planned (v2.0+)
- Postflop trainer with flop, turn, river scenarios
- Tournament chip EV calculations
- Custom range builder
- Performance analytics dashboard
- Hand range comparison tool
- Multiway pot training
- User accounts and progress tracking

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ ([Download](https://nodejs.org))
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/poker-gto-trainer.git
   cd poker-gto-trainer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   Open your browser to `http://localhost:5173`

### Build for Production
```bash
npm run build
```

## 📁 Project Structure

```
poker-gto-trainer/
├── src/
│   ├── components/          # React components
│   │   ├── PokerTable/     # Main table visualization
│   │   ├── ActionButtons/  # Fold, Call, Raise controls
│   │   └── GTODisplay/     # GTO percentage display
│   ├── data/               # Static GTO data
│   │   └── preflop-ranges.json
│   ├── hooks/              # Custom React hooks
│   │   ├── useGame.ts      # Game state logic
│   │   └── useGTO.ts       # GTO lookup & matching
│   ├── types/              # TypeScript interfaces
│   └── App.tsx
├── public/                 # Static assets
├── package.json
├── vite.config.ts
└── README.md
```

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| State Management | React Hooks (useState, useContext) |
| GTO Data | JSON (scalable to database) |
| Hosting | GitHub Pages / Vercel |

## 📊 How GTO Training Works

1. **Random Scenario Generated** - You're assigned a position, stack depth, and opponent action
2. **You Make a Decision** - Fold, Call, or Raise
3. **GTO Recommendation Shown** - See what optimal play suggests
4. **Feedback Provided** - Learn why GTO recommends this action
5. **Track Progress** - Monitor accuracy over sessions

### Example Preflop Scenario
```
Position:       Button (BTN)
Stack Depth:    25 BB
Action:         Fold, Fold, Fold (folded to you)
Your Hand:      Q♣ 9♦

GTO Says: RAISE 85% | FOLD 15%
You Said: FOLD ❌
```

## 📚 GTO Data Format

Preflop ranges are stored in `src/data/preflop-ranges.json`:

```json
{
  "positions": {
    "UTG": {
      "openRaise": "88+, AJs+, KJs+, QJs, AKo",
      "openRaisePercent": 14.5
    },
    "CO": {
      "openRaise": "77+, AJs+, KJs+, QJs, ATo, KJo, AKo",
      "openRaisePercent": 22.3
    }
  }
}
```

## 🎮 Game Mechanics

### Positions (6-Max)
- **UTG** (Under The Gun) - Early Position
- **MP** (Middle Position) - Middle Position
- **CO** (Cutoff) - Late Early Position
- **BTN** (Button) - Late Position
- **SB** (Small Blind) - Blind Position
- **BB** (Big Blind) - Blind Position

### Actions
- **Fold** - Muck your hand
- **Call** - Match current bet
- **Raise** - Increase bet amount

### Metrics
- **Accuracy %** - How often you match GTO
- **Alignment Score** - Overall decision quality
- **Session Stats** - Hands trained, time spent

## 🔄 Roadmap

**Phase 1 (Current)**
- ✅ Preflop range trainer
- ✅ GTO display
- ⬜ Hand history

**Phase 2 (Q1 2025)**
- Postflop trainer
- Equity calculator
- Position-specific drills

**Phase 3 (Q2 2025)**
- Tournament chip EV
- Custom ranges
- Analytics dashboard

**Phase 4 (Q3 2025)**
- User authentication
- Progress tracking
- Leaderboard

## 🌐 Deployment

### Deploy to GitHub Pages (Free)

1. Update `package.json`:
   ```json
   "homepage": "https://yourusername.github.io/poker-gto-trainer"
   ```

2. Install GitHub Pages package:
   ```bash
   npm install --save-dev gh-pages
   ```

3. Add deploy scripts to `package.json`:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

### Deploy to Vercel (Recommended for React)

1. Sign up at [Vercel](https://vercel.com)
2. Connect GitHub repository
3. Vercel automatically deploys on push
4. Auto-scaling and global CDN included

**[See full deployment guide →](#)**

## 📖 GTO Strategy Resources

- [Advanced Poker Statistics](https://www.advancedpokerstatistics.com)
- [GTO Wizard Concepts](https://gtowizard.com)
- [Upswing Poker GTO Fundamentals](https://www.upswingpoker.com)
- [Run It Once Preflop Ranges](https://www.runinonce.com)

## 💡 Learning Tips

1. **Start Early Position** - Tighter ranges, easier to learn
2. **Focus on one position** per session
3. **Review feedback carefully** - Understand the "why"
4. **Track weak spots** - Note which positions you struggle with
5. **Practice consistency** - Aim for 80%+ accuracy before moving on

## 🤝 Contributing

Contributions welcome! Areas where help is needed:

- GTO range accuracy checks
- Postflop chart additions
- UI/UX improvements
- Performance optimizations
- Bug reports & fixes

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Note:** This is an educational tool for poker strategy learning. Always play poker responsibly and within your bankroll.

## 🐛 Issues & Support

Found a bug? Have a feature request?

- **[Open an Issue](https://github.com/asantavilla/GTOMaxy/issues)**
- **[Discussions](https://github.com/asantavilla/GTOMaxy/discussions)**
- **Email**: alosantavilla@gmail.com

## 📧 Contact & Social

- 💼 LinkedIn: [My Profile]([https://linkedin.com](https://www.linkedin.com/in/alonso-santana-villafranca-974290430/))

---

**Last Updated:** September 1,2026 | **Version:** 1.0.0

**⭐ If this helped improve your poker game, please star the repository!**

### Acknowledgments

- GTO theory concepts from professional poker literature
- Community feedback and suggestions
- Poker training community support
