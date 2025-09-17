#!/usr/bin/env python3
"""
LCM File Generator for Shimadzu LabSolutions Compatibility
Generates .LCM files with proper formatting for HPLC data import
"""

import json
import sys
import struct
import datetime
from typing import Dict, List, Any

class LCMGenerator:
    def __init__(self):
        self.version = "1.0"
        self.file_type = "LC"

    def generate_lcm_header(self, sample_data: Dict[str, Any]) -> bytes:
        """Generate LCM file header with metadata"""
        header = bytearray()

        # File signature
        header.extend(b'LCM\x00')

        # Version
        header.extend(struct.pack('<H', 100))  # Version 1.00

        # Sample ID (32 bytes)
        sample_id = sample_data['sampleId'][:31].encode('utf-8')
        header.extend(sample_id.ljust(32, b'\x00'))

        # Sample Name (64 bytes)
        sample_name = sample_data['sampleName'][:63].encode('utf-8')
        header.extend(sample_name.ljust(64, b'\x00'))

        # Analysis Date
        analysis_date = datetime.datetime.fromisoformat(sample_data['analysisDate'].replace('Z', '+00:00'))
        timestamp = int(analysis_date.timestamp())
        header.extend(struct.pack('<I', timestamp))

        # Number of peaks
        peak_count = len(sample_data['peaks'])
        header.extend(struct.pack('<H', peak_count))

        # Reserved space (64 bytes)
        header.extend(b'\x00' * 64)

        return bytes(header)

    def generate_peak_data(self, peaks: List[Dict[str, Any]]) -> bytes:
        """Generate peak data section"""
        peak_data = bytearray()

        for i, peak in enumerate(peaks):
            # Peak number
            peak_data.extend(struct.pack('<H', i + 1))

            # Retention time (minutes as float)
            rt = float(peak.get('retentionTime', 0))
            peak_data.extend(struct.pack('<f', rt))

            # Area
            area = float(peak.get('area', 0))
            peak_data.extend(struct.pack('<d', area))

            # Height
            height = float(peak.get('height', 0))
            peak_data.extend(struct.pack('<d', height))

            # Concentration (if available)
            concentration = float(peak.get('concentration', 0))
            peak_data.extend(struct.pack('<f', concentration))

            # Peak name (32 bytes)
            peak_name = peak.get('peakName', f'Peak_{i+1}')[:31].encode('utf-8')
            peak_data.extend(peak_name.ljust(32, b'\x00'))

            # Peak width (estimated)
            width = 0.1  # Default width
            peak_data.extend(struct.pack('<f', width))

            # Peak asymmetry
            asymmetry = 1.0  # Default symmetrical
            peak_data.extend(struct.pack('<f', asymmetry))

            # Reserved (16 bytes)
            peak_data.extend(b'\x00' * 16)

        return bytes(peak_data)

    def generate_instrument_data(self, instrument_settings: Dict[str, Any]) -> bytes:
        """Generate instrument settings section"""
        inst_data = bytearray()

        # Column info (64 bytes)
        column = instrument_settings.get('column', 'Unknown')[:63].encode('utf-8')
        inst_data.extend(column.ljust(64, b'\x00'))

        # Mobile phase (128 bytes)
        mobile_phase = instrument_settings.get('mobile_phase', 'Unknown')[:127].encode('utf-8')
        inst_data.extend(mobile_phase.ljust(128, b'\x00'))

        # Flow rate
        flow_rate = float(instrument_settings.get('flow_rate', 1.0))
        inst_data.extend(struct.pack('<f', flow_rate))

        # Injection volume
        injection_vol = float(instrument_settings.get('injection_volume', 10.0))
        inst_data.extend(struct.pack('<f', injection_vol))

        # Detection wavelength
        wavelength = float(instrument_settings.get('detection_wavelength', 254.0))
        inst_data.extend(struct.pack('<f', wavelength))

        # Temperature
        temperature = float(instrument_settings.get('temperature', 25.0))
        inst_data.extend(struct.pack('<f', temperature))

        # Reserved (32 bytes)
        inst_data.extend(b'\x00' * 32)

        return bytes(inst_data)

    def generate_chromatogram_data(self, peaks: List[Dict[str, Any]]) -> bytes:
        """Generate simulated chromatogram data points"""
        # Generate 1000 data points for chromatogram
        data_points = 1000
        max_time = max([peak.get('retentionTime', 0) for peak in peaks]) * 1.2 if peaks else 10.0

        chrom_data = bytearray()
        chrom_data.extend(struct.pack('<I', data_points))  # Number of points
        chrom_data.extend(struct.pack('<f', max_time))     # Max time

        # Generate data points (time, intensity pairs)
        for i in range(data_points):
            time_point = (i / data_points) * max_time
            intensity = 0.0

            # Add peak contributions
            for peak in peaks:
                rt = peak.get('retentionTime', 0)
                height = peak.get('height', 0)
                # Simple Gaussian peak simulation
                if abs(time_point - rt) < 0.5:  # Peak width
                    intensity += height * 0.8 * (1 - ((time_point - rt) / 0.25) ** 2)

            # Add baseline noise
            intensity += 10.0  # Baseline

            chrom_data.extend(struct.pack('<f', time_point))
            chrom_data.extend(struct.pack('<f', max(0, intensity)))

        return bytes(chrom_data)

    def generate_lcm_file(self, sample_data: Dict[str, Any], output_path: str):
        """Generate complete LCM file"""
        with open(output_path, 'wb') as f:
            # Write header
            header = self.generate_lcm_header(sample_data)
            f.write(header)

            # Write instrument data
            inst_data = self.generate_instrument_data(sample_data.get('instrumentSettings', {}))
            f.write(inst_data)

            # Write peak data
            peak_data = self.generate_peak_data(sample_data.get('peaks', []))
            f.write(peak_data)

            # Write chromatogram data
            chrom_data = self.generate_chromatogram_data(sample_data.get('peaks', []))
            f.write(chrom_data)

            # Write footer
            footer = b'LCMEND\x00'
            f.write(footer)

def main():
    if len(sys.argv) != 3:
        print("Usage: python generate_lcm.py <input_json> <output_lcm>", file=sys.stderr)
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    try:
        # Read input data
        with open(input_path, 'r') as f:
            sample_data = json.load(f)

        # Generate LCM file
        generator = LCMGenerator()
        generator.generate_lcm_file(sample_data, output_path)

        print(f"LCM file generated successfully: {output_path}")

    except Exception as e:
        print(f"Error generating LCM file: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()