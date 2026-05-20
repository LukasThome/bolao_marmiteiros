Feature: Autenticação

  Background:
    Given o usuário não está autenticado

  Scenario: Acesso a rota protegida redireciona para login
    When o usuário acessa "/dashboard"
    Then ele é redirecionado para "/login"

  Scenario: Login com Google OAuth
    Given o usuário está na página de login
    When ele clica em "Entrar com Google"
    And completa o fluxo OAuth do Google com sucesso
    Then ele é redirecionado para "/dashboard"
    And seu nome aparece no cabeçalho

  Scenario: Primeiro login cria usuário no banco
    Given nenhum usuário com email "novo@gmail.com" existe no banco
    When o usuário faz login com esse email via Google
    Then um registro User é criado com role "MEMBER"
    And um registro BolaoMember NÃO é criado automaticamente

  Scenario: Logout encerra a sessão
    Given o usuário está autenticado
    When ele clica em "Sair"
    Then a sessão é encerrada
    And ele é redirecionado para "/login"
