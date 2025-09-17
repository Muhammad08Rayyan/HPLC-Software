# HPLC Report Generator

A comprehensive HPLC (High-Performance Liquid Chromatography) report generation system with .LCM file export capabilities for pharmaceutical, chemical, and research laboratories.

## Features

- **Custom HPLC Report Generation**: Generate PDF reports with configurable data fields
- **LCM File Export**: Generate .LCM files compatible with Shimadzu LabSolutions
- **Role-Based Access Control**: Admin, Analyst, and Viewer roles
- **Real-Time Preview**: Live preview of chromatogram data and reports
- **Batch Data Upload**: Support for CSV and Excel file uploads
- **Audit Trail**: Complete logging of all system activities
- **Admin Configuration**: Customizable field labels and report templates

## Technology Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT-based with role management
- **File Generation**: jsPDF for reports, Python for LCM files
- **Charts**: Recharts for data visualization

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+
- MongoDB database

### Installation

1. Install dependencies:
```bash
npm install
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables in `.env.local`:
```
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_secret_key
JWT_SECRET=your_jwt_secret
```

4. Create initial admin user:
```bash
node scripts/setup-admin.js
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Login Credentials

After running the setup script:

**Admin User:**
- Email: admin@hplc.com
- Password: admin123

**Sample Analyst:**
- Email: analyst@hplc.com
- Password: analyst123

⚠️ **Important**: Change these default passwords after first login!

## 🎬 Demo Data

The system comes pre-loaded with **5 realistic HPLC samples** for immediate exploration:

1. **CAF001** - Caffeine Standard (3 peaks) ✅ Reports Generated
2. **PHARM002** - Ibuprofen Tablet (2 peaks) ✅ PDF Report
3. **ENV003** - Pesticide Analysis (4 peaks)
4. **FOOD004** - Vitamin C Analysis (2 peaks) ✅ Complete
5. **PROT005** - Protein Purity (3 peaks)

**Sample CSV files** for testing uploads:
- `sample-data/sample-hplc-data.csv`
- `sample-data/pesticide-analysis.csv`

📖 **See [DEMO-GUIDE.md](./DEMO-GUIDE.md) for complete walkthrough!**

## User Roles

| Role | Permissions |
|------|------------|
| **Admin** | Full system access, user management, configuration |
| **Analyst** | Data input, report generation, LCM export |
| **Viewer** | Read-only access to reports and data |

## Core Functionality

### Data Input
- Manual entry form for HPLC data
- Batch upload via CSV/Excel files
- Peak data (retention time, area, height, concentration)
- Instrument settings and system suitability parameters

### Report Generation
- PDF reports with customizable templates
- Include/exclude fields based on admin configuration
- System suitability parameters
- Peak tables and charts

### LCM File Export
- Generate .LCM files compatible with Shimadzu LabSolutions
- Binary format with proper metadata
- Simulated chromatogram data points
- Peak list and instrument settings

### Administration
- User management (create, view users)
- Report configuration (field labels, templates)
- Peak count settings (default, min, max)
- Enable/disable specific data fields

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically

## Security Features

- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- Input validation and sanitization
- Audit trail logging
- Secure cookie handling

## Compliance

- **21 CFR Part 11 Ready**: Audit trails and data integrity
- **LabSolutions Compatible**: Validated .LCM file format
- **Data Security**: Encrypted storage and transmission