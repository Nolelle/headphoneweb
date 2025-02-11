import bcrypt from "bcrypt";

async function generateAdminHash() {
  // Constants
  const ADMIN_PASSWORD = "admin123";
  const SALT_ROUNDS = 10;

  try {
    // Generate salt and hash
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hash = await bcrypt.hash(ADMIN_PASSWORD, salt);

    // Output the results
    console.log("----------------------------------------");
    console.log("Admin Password Hash Generator");
    console.log("----------------------------------------");
    console.log("Password:", ADMIN_PASSWORD);
    console.log("Generated Hash:", hash);
    console.log("----------------------------------------");
  } catch (error) {
    console.error("Error generating hash:", error);
    process.exit(1);
  }
}

// Execute the function
generateAdminHash();
