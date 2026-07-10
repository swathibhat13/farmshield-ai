import os

file_path = 'src/components/AdminDashboard.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    'bg-[#020b08]': 'bg-gray-50 dark:bg-[#020b08]',
    'text-white': 'text-gray-900 dark:text-white',
    'bg-[#0f172a]': 'bg-white dark:bg-[#0f172a]',
    'bg-white/[0.03]': 'bg-white shadow-sm dark:bg-white/[0.03] dark:shadow-none',
    'border-white/10': 'border-gray-200 dark:border-white/10',
    'border-white/5': 'border-gray-100 dark:border-white/5',
    'bg-white/5': 'bg-gray-100 dark:bg-white/5',
    'hover:bg-white/10': 'hover:bg-gray-200 dark:hover:bg-white/10',
    'hover:bg-white/5': 'hover:bg-gray-200 dark:hover:bg-white/5',
    'hover:bg-white/[0.02]': 'hover:bg-gray-50 dark:hover:bg-white/[0.02]',
    'text-cool-slate': 'text-gray-500 dark:text-cool-slate',
    'divide-white/[0.04]': 'divide-gray-200 dark:divide-white/[0.04]',
    'bg-black/40': 'bg-white dark:bg-black/40',
    'bg-black/70': 'bg-gray-900/40 dark:bg-black/70',
    'border-white/20': 'border-gray-300 dark:border-white/20',
    'border-white/30': 'border-gray-400 dark:border-white/30',
    'text-white/60': 'text-gray-400 dark:text-white/60',
    'hover:text-white': 'hover:text-gray-900 dark:hover:text-white',
}

# Apply replacements
for old, new in replacements.items():
    content = content.replace(old, new)

# First wrap the root element with theme class
content = content.replace('<div className="min-h-screen', '<div className={theme}>\n      <div className="min-h-screen')

# Add closing div
content = content.replace('      )}\n    </div>\n  );\n};', '      )}\n    </div>\n    </div>\n  );\n};')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
