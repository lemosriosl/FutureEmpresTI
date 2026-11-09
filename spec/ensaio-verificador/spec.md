# Spec do ensaio do verificador

## Escopo

Demonstrar a detecção e correção de uma falha controlada em uma branch local
separada. O diff pode incluir somente esta spec, a função de exemplo, seu
teste e o runner que inicia o processo de teste com ambiente limpo.

## Critério de aceite

CA-ENSAIO-01 — A função remove espaços no início e no fim do identificador
fictício, preservando a grafia interna.

## Check

Rode `node rodar.cjs` nesta pasta. O exemplo não precisa de dependências
externas, credenciais, rede ou banco. Os scripts de aplicação não se aplicam
ao ensaio.
