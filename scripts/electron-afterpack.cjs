const path = require("path");
const fs = require("fs");

/**
 * electron-builder afterPack hook.
 *
 * Copies the Next.js standalone server into the app's resources. Done here
 * with fs.cp because extraResources' glob filters silently drop dot-dirs
 * (.next) and node_modules — both required to run the server.
 */
module.exports = async function afterPack(context) {
  const root = path.resolve(__dirname, "..");
  const resources =
    context.electronPlatformName === "darwin"
      ? path.join(
          context.appOutDir,
          `${context.packager.appInfo.productFilename}.app`,
          "Contents",
          "Resources"
        )
      : path.join(context.appOutDir, "resources");

  const dest = path.join(resources, "app-server");
  const copies = [
    [path.join(root, ".next", "standalone"), dest],
    [path.join(root, ".next", "static"), path.join(dest, ".next", "static")],
    [path.join(root, "public"), path.join(dest, "public")],
  ];

  for (const [from, to] of copies) {
    if (!fs.existsSync(from)) {
      throw new Error(`afterPack: missing ${from} — run BUILD_STANDALONE=1 next build first`);
    }
    await fs.promises.cp(from, to, { recursive: true, dereference: true });
  }
  console.log(`  • afterPack copied Next.js standalone server → ${dest}`);
};
