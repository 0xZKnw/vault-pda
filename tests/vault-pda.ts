const anchor = require("@coral-xyz/anchor");
const { SystemProgram, LAMPORTS_PER_SOL } = anchor.web3;

describe("vault-pda", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.vault_pda;

  function toSol(lamports) {
    return (lamports / LAMPORTS_PER_SOL).toLocaleString("fr-FR", { maximumFractionDigits: 9 });
  }

  it("Init Vault, Dépôt SOL puis Retrait", async () => {
    const provider = anchor.AnchorProvider.env();
    const user = provider.wallet.publicKey;
    console.log("Provider publicKey:", user.toBase58());
    console.log("ProgramID:", program.programId.toBase58());

    const [vaultPda, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("vault"), user.toBuffer()],
      program.programId
    );
    console.log("Vault PDA:", vaultPda.toBase58());
    console.log("Vault bump:", bump);

    const userBalBefore = await provider.connection.getBalance(user);
    console.log(`SOL user AVANT init: ${toSol(userBalBefore)} SOL`);

    const txInit = await program.methods.initalizeVault().accounts({
      user: user,
      vault: vaultPda,
      systemProgram: SystemProgram.programId,
    }).rpc();
    console.log("Tx signature init:", txInit);

    const userBalAfterInit = await provider.connection.getBalance(user);
    console.log(`SOL user APRÈS init: ${toSol(userBalAfterInit)} SOL`);

    const vaultBalanceAfterInit = await provider.connection.getBalance(vaultPda);
    console.log(`SOL sur Vault APRES init: ${toSol(vaultBalanceAfterInit)} SOL`);

    const montantSol = 0.015;
    const montantLamports = Math.round(montantSol * LAMPORTS_PER_SOL);
    console.log(`\n>>> Envoi de ${montantSol} SOL (${montantLamports} lamports) vers la vault...`);

    const txDeposit = await provider.sendAndConfirm(
      new anchor.web3.Transaction().add(
        SystemProgram.transfer({
          fromPubkey: user,
          toPubkey: vaultPda,
          lamports: montantLamports
        })
      )
    );
    console.log("Tx signature dépôt:", txDeposit);

    const userBalAfterDeposit = await provider.connection.getBalance(user);
    console.log(`SOL user APRÈS dépôt: ${toSol(userBalAfterDeposit)} SOL`);

    const vaultBalanceAfterDeposit = await provider.connection.getBalance(vaultPda);
    console.log(`SOL sur Vault APRÈS dépôt: ${toSol(vaultBalanceAfterDeposit)} SOL`);

    try {
      const vaultData = await program.account.vaultAccount.fetch(vaultPda);
      console.log("vaultAccount:", vaultData);
    } catch (e) {
      console.warn("vaultAccount fetch ERROR:", e);
    }

    const montantSolRetrait = 0.005;
    const montantLamportsRetrait = Math.round(montantSolRetrait * LAMPORTS_PER_SOL);
    console.log(`\n>>> Retrait de ${montantSolRetrait} SOL (${montantLamportsRetrait} lamports) depuis la vault...`);

    const userBeforeWithdraw = await provider.connection.getBalance(user);
    const vaultBeforeWithdraw = await provider.connection.getBalance(vaultPda);
    console.log(`SOL user AVANT retrait: ${toSol(userBeforeWithdraw)} SOL`);
    console.log(`SOL vault AVANT retrait: ${toSol(vaultBeforeWithdraw)} SOL`);

    const txWithdraw = await program.methods
      .withdraw(new anchor.BN(montantLamportsRetrait))
      .accounts({
        user,
        vault: vaultPda,
      })
      .rpc();
    console.log("Tx signature retrait:", txWithdraw);

    const userAfterWithdraw = await provider.connection.getBalance(user);
    const vaultAfterWithdraw = await provider.connection.getBalance(vaultPda);
    console.log(`SOL user APRÈS retrait: ${toSol(userAfterWithdraw)} SOL`);
    console.log(`SOL vault APRÈS retrait: ${toSol(vaultAfterWithdraw)} SOL`);

    console.log("\nRésumé :", {
      user: user.toBase58(),
      vault: vaultPda.toBase58(),
      bump,
      txInit,
      txDeposit,
      txWithdraw
    });
  });
});
