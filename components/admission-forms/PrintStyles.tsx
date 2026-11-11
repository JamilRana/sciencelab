"use client";

import React from "react";

export function PrintStyles() {
  return (
    <style jsx global>{`
      @media print {
        @page {
          size: A4 portrait;
          margin: 4mm 6mm !important;
        }

        html, body {
          background: #ffffff !important;
          color: #000000 !important;
          margin: 0 !important;
          padding: 0 !important;
          font-family: var(--font-bengali), var(--font-inter), sans-serif !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* Hide all outer layout chrome */
        header,
        nav,
        aside,
        .no-print,
        button:not(.allow-print),
        .top-bar-container,
        .sidebar-container,
        [data-sidebar="true"] {
          display: none !important;
        }

        main {
          margin: 0 !important;
          padding: 0 !important;
          max-width: 100% !important;
        }

        /* Target the printable A4 page container */
        .admission-form-print-sheet {
          box-shadow: none !important;
          border: none !important;
          margin: 0 auto !important;
          padding: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          max-height: 285mm !important;
          page-break-inside: avoid !important;
          page-break-after: avoid !important;
          page-break-before: avoid !important;
          overflow: hidden !important;
        }

        /* Retain borders, dashed outlines, badges and background tints */
        .print-exact {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .avoid-break {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
      }
    `}</style>
  );
}
