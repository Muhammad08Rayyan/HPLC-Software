# 🧪 HPLC Report Generator - Demo Guide

## 🚀 Quick Start

1. **Start the application:**
   ```bash
   npm run dev
   ```
   Open: http://localhost:3000

2. **Login with demo accounts:**

   **Admin Account:**
   - Email: `admin@hplc.com`
   - Password: `admin123`

   **Analyst Account:**
   - Email: `analyst@hplc.com`
   - Password: `analyst123`

## 📊 Sample Data Overview

The system now contains **5 realistic HPLC samples** across different industries:

### 1. 🍃 **CAF001 - Caffeine Standard Solution**
- **Analyst:** Dr. Sarah Johnson (Quality Control)
- **Peaks:** 3 (Caffeine + 2 impurities)
- **Status:** ✅ PDF Report ✅ LCM File
- **Use Case:** Pharmaceutical reference standard

### 2. 💊 **PHARM002 - Ibuprofen Tablet Extract**
- **Analyst:** Dr. Michael Chen (Pharmaceutical Analysis)
- **Peaks:** 2 (Ibuprofen + degradant)
- **Status:** ✅ PDF Report
- **Use Case:** Drug assay and purity testing

### 3. 🌍 **ENV003 - Groundwater Pesticide Analysis**
- **Analyst:** Dr. Lisa Rodriguez (Environmental Testing)
- **Peaks:** 4 (Atrazine, Simazine, Metolachlor, Alachlor)
- **Status:** Pending reports
- **Use Case:** Environmental contamination monitoring

### 4. 🍊 **FOOD004 - Vitamin C in Orange Juice**
- **Analyst:** Dr. Ahmed Hassan (Food Safety)
- **Peaks:** 2 (Ascorbic Acid + Citric Acid)
- **Status:** ✅ PDF Report ✅ LCM File
- **Use Case:** Nutritional analysis

### 5. 🧬 **PROT005 - Monoclonal Antibody Purity**
- **Analyst:** Dr. Jennifer Park (Biotechnology)
- **Peaks:** 3 (Main peak + aggregate + fragment)
- **Status:** Pending reports
- **Use Case:** Protein characterization

## 🎯 Demo Workflow

### **For Admin Users:**

1. **Dashboard Overview**
   - View system statistics
   - Monitor recent activity
   - See usage trends

2. **Admin Panel** (`/admin`)
   - Configure report templates
   - Manage field settings
   - Create new users
   - Customize peak count limits

3. **Audit History** (`/history`)
   - Review all system activities
   - Filter by user, action, or date
   - Track data integrity

### **For Analyst Users:**

1. **Dashboard** (`/dashboard`)
   - Overview of your samples
   - Activity charts
   - Recent work

2. **Data Input** (`/data-input`)
   - **Manual Entry:** Add new HPLC data
   - **File Upload:** Try the sample CSV files:
     - `sample-data/sample-hplc-data.csv`
     - `sample-data/pesticide-analysis.csv`

3. **Reports & Export** (`/reports`)
   - Generate PDF reports for existing samples
   - Export .LCM files for LabSolutions
   - Preview chromatogram data

## 📈 Features to Explore

### **Real-Time Preview**
- Click on any sample in Reports page
- View interactive peak charts
- See detailed peak tables

### **PDF Report Generation**
- Try generating reports for samples with existing data
- Reports include:
  - Sample information
  - Peak tables
  - System suitability parameters
  - Instrument settings

### **LCM File Export**
- Generate LabSolutions-compatible files
- Binary format with proper headers
- Includes peak data and metadata

### **Batch Upload**
- Upload the provided CSV files
- See automatic data parsing
- Review uploaded samples

### **Configuration Management**
- Admin can customize field labels
- Enable/disable specific data fields
- Configure default peak counts

## 🔬 Sample Report Data

### Caffeine Analysis (CAF001)
```
Peak 1: Caffeine
- RT: 2.345 min
- Area: 1,245,678
- Height: 89,234
- Concentration: 98.7%

Peak 2: Impurity A
- RT: 4.567 min
- Area: 45,123
- Height: 3,245
- Concentration: 1.2%

Peak 3: Impurity B
- RT: 6.789 min
- Area: 12,456
- Height: 1,234
- Concentration: 0.1%
```

### System Suitability
- Resolution: 2.8
- Efficiency: 15,234
- Asymmetry: 1.2
- Repeatability: 0.8%

### Instrument Settings
- Column: C18, 250mm x 4.6mm, 5μm
- Mobile Phase: Water:Acetonitrile (70:30)
- Flow Rate: 1.0 mL/min
- Detection: 254 nm
- Temperature: 25°C

## 🎪 Demo Scenarios

### **Scenario 1: Quality Control Manager**
1. Login as admin
2. Review dashboard statistics
3. Check audit trail for compliance
4. Generate reports for regulatory submission

### **Scenario 2: Laboratory Analyst**
1. Login as analyst
2. Upload new sample data via CSV
3. Generate PDF report
4. Export LCM file for instrument integration

### **Scenario 3: Method Development**
1. Input new method parameters
2. Analyze peak data
3. Review system suitability
4. Generate validation reports

## 📁 File Locations

- **Sample CSV files:** `sample-data/`
- **Database scripts:** `scripts/`
- **Generated reports:** Downloaded to browser
- **LCM files:** Downloaded to browser

## 🔧 Testing Features

### Upload Test Files
```bash
# Sample files ready for upload:
sample-data/sample-hplc-data.csv
sample-data/pesticide-analysis.csv
```

### Generate Reports
- Visit `/reports`
- Select CAF001 or FOOD004 (marked as generated)
- Click "PDF" or "LCM" buttons

### Admin Configuration
- Visit `/admin`
- Try changing field labels
- Modify peak count settings
- Create new user accounts

## 🏆 Pro Tips

1. **Use realistic data** - All samples have authentic HPLC parameters
2. **Test different roles** - Switch between admin and analyst accounts
3. **Try batch operations** - Upload multiple samples via CSV
4. **Explore charts** - Interactive peak visualization in Reports
5. **Check audit trail** - Every action is logged for compliance

---

## 🎉 **Your HPLC system is now fully populated and ready for exploration!**

The sample data represents real-world analytical scenarios across pharmaceutical, environmental, food, and biotechnology industries. Each sample includes complete peak data, system suitability parameters, and instrument settings for authentic demonstration of the system's capabilities.