const [major] = process.versions.node.split('.').map(Number);

if (major !== 22) {
  console.error(
    [
      `Unsupported Node.js version: ${process.versions.node}`,
      'AutoFans runs on Node.js 22.x.',
      'Switch Node before running this command to avoid Vite/Tailwind deprecation warnings on newer majors.',
      'Example: `nvm use 22`',
    ].join('\n'),
  );
  process.exit(1);
}
