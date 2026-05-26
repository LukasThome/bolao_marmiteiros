export default function BetaBanner() {
  return (
    <div
      className="w-full text-center py-2 px-4 text-xs font-medium"
      style={{
        backgroundColor: "var(--gold-subtle)",
        color: "var(--gold)",
        borderBottom: "1px solid var(--gold)",
      }}
    >
      🚧 <strong>BETA</strong> — Sistema em testes. O banco de dados poderá ser resetado sem aviso prévio.
    </div>
  );
}
