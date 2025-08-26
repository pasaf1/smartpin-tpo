'use client'

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes"
import { cssVariables } from "@/lib/design-tokens"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider 
      attribute="class" 
      defaultTheme="light" 
      enableSystem={true}
      disableTransitionOnChange
      {...props}
    >
      <style jsx global>{`
        :root {
          ${Object.entries(cssVariables)
            .map(([key, value]) => `${key}: ${value};`)
            .join('\n          ')}
        }
      `}</style>
      {children}
    </NextThemesProvider>
  )
}