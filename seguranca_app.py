"""
Módulo de segurança para o aplicativo Pintor Plus
Implementa verificações e proteções contra vazamento de dados sensíveis
"""

import re
from datetime import datetime, timedelta
from typing import Dict, List, Any
import hashlib
import logging
from googleapiclient.discovery import build


class SegurancaApp:
    def __init__(self, credentials):
        """
        Inicializa o módulo de segurança

        Args:
            credentials: Credenciais OAuth2 para acesso ao Google Drive
        """
        self.service = build('drive', 'v3', credentials=credentials)
        self.logger = self._setup_logger()

    def _setup_logger(self) -> logging.Logger:
        """
        Configura o logger para registrar eventos de segurança

        Returns:
            Logger configurado
        """
        logger = logging.getLogger('seguranca_pintor_plus')
        logger.setLevel(logging.INFO)

        handler = logging.FileHandler('seguranca.log')
        formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
        handler.setFormatter(formatter)

        if not logger.handlers:
            logger.addHandler(handler)

        return logger

    def verificar_vazamento_dados_sensiveis(self) -> List[Dict[str, Any]]:
        """
        Verifica possíveis vazamentos de dados sensíveis no Google Drive

        Returns:
            Lista de arquivos suspeitos
        """
        arquivos_suspeitos = []

        # Tipos de dados sensíveis a verificar
        padroes_sensiveis = [
            r'\b\d{3}-?\d{2}-?\d{4}\b',  # SSN
            r'\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b',  # CPF
            r'\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b',  # CNPJ
            r'\b[A-Z]{2}\d{7}\b',  # RG
            r'\b\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}\b',  # Cartão de crédito
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',  # Email (genérico)
            r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b',  # IP Address
        ]

        # Buscar arquivos no Drive
        results = self.service.files().list(
            fields="files(id, name, mimeType, createdTime, modifiedTime, owners)"
        ).execute()

        files = results.get('files', [])

        for file in files:
            # Verificar nome do arquivo por dados sensíveis
            nome_arquivo = file.get('name', '')
            for i, padrao in enumerate(padroes_sensiveis):
                if re.search(padrao, nome_arquivo, re.IGNORECASE):
                    arquivos_suspeitos.append({
                        'id': file.get('id'),
                        'nome': file.get('name'),
                        'motivo': self._get_tipo_dado_sensivel(i),
                        'timestamp': datetime.now(),
                        'acao_recomendada': 'Verificar conteúdo do arquivo'
                    })

        return arquivos_suspeitos

    def _get_tipo_dado_sensivel(self, indice: int) -> str:
        """
        Retorna o tipo de dado sensível com base no índice do padrão

        Args:
            indice: Índice do padrão na lista

        Returns:
            Tipo de dado sensível
        """
        tipos = [
            'Número de Seguro Social (SSN)',
            'CPF',
            'CNPJ',
            'RG',
            'Número de cartão de crédito',
            'Endereço de e-mail',
            'Endereço IP'
        ]
        return tipos[indice] if indice < len(tipos) else 'Dado sensível desconhecido'

    def verificar_acesso_nao_autorizado(self) -> List[Dict[str, Any]]:
        """
        Verifica acessos não autorizados aos arquivos do app

        Returns:
            Lista de acessos suspeitos
        """
        acessos_suspeitos = []

        # Buscar arquivos do app
        query = "name contains 'Pintor-Plus'"
        results = self.service.files().list(
            q=query,
            fields="files(id, name, sharingUser, permissions)"
        ).execute()

        files = results.get('files', [])

        for file in files:
            permissions = file.get('permissions', [])
            for permission in permissions:
                # Verificar se o compartilhamento está com pessoas externas
                if permission.get('type') == 'domain' or permission.get('type') == 'anyone':
                    acessos_suspeitos.append({
                        'arquivo_id': file.get('id'),
                        'arquivo_nome': file.get('name'),
                        'tipo_permissao': permission.get('type'),
                        'detalhes': permission,
                        'timestamp': datetime.now(),
                        'acao_recomendada': 'Rever permissões de compartilhamento'
                    })

        return acessos_suspeitos

    def verificar_integridade_arquivos(self) -> List[Dict[str, Any]]:
        """
        Verifica a integridade dos arquivos importantes do app

        Returns:
            Lista de arquivos com problemas de integridade
        """
        problemas_integridade = []

        # Buscar arquivos críticos do app
        query = "name contains 'orcamento' or name contains 'cliente' or name contains 'empresa'"
        results = self.service.files().list(
            q=query,
            fields="files(id, name, md5Checksum, createdTime, modifiedTime, owners)"
        ).execute()

        files = results.get('files', [])

        for file in files:
            # Registrar alterações não autorizadas
            modified_time = datetime.fromisoformat(
                file.get('modifiedTime').replace('Z', '+00:00')
            )
            created_time = datetime.fromisoformat(
                file.get('createdTime').replace('Z', '+00:00')
            )

            # Se o arquivo foi modificado logo após a criação, pode ser suspeito
            if (modified_time - created_time).seconds < 5:
                problemas_integridade.append({
                    'id': file.get('id'),
                    'nome': file.get('name'),
                    'evento': 'Arquivo modificado logo após criação',
                    'timestamp': datetime.now(),
                    'acao_recomendada': 'Verificar conteúdo do arquivo'
                })

        return problemas_integridade

    def gerar_relatorio_seguranca(self) -> Dict[str, Any]:
        """
        Gera um relatório completo de segurança

        Returns:
            Dicionário com informações de segurança
        """
        dados_sensiveis = self.verificar_vazamento_dados_sensiveis()
        acessos_suspeitos = self.verificar_acesso_nao_autorizado()
        problemas_integridade = self.verificar_integridade_arquivos()

        relatorio = {
            'timestamp': datetime.now(),
            'dados_sensiveis_encontrados': len(dados_sensiveis),
            'acessos_suspeitos': len(acessos_suspeitos),
            'problemas_integridade': len(problemas_integridade),
            'detalhes': {
                'dados_sensiveis': dados_sensiveis,
                'acessos_suspeitos': acessos_suspeitos,
                'problemas_integridade': problemas_integridade
            }
        }

        # Logar resultados
        self.logger.info(f"Relatório de segurança gerado: "
                        f"{relatorio['dados_sensiveis_encontrados']} dados sensíveis, "
                        f"{relatorio['acessos_suspeitos']} acessos suspeitos, "
                        f"{relatorio['problemas_integridade']} problemas de integridade")

        return relatorio

    def aplicar_correcoes_seguranca(self, relatorio: Dict[str, Any]):
        """
        Aplica correções automáticas com base no relatório de segurança

        Args:
            relatorio: Relatório de segurança gerado anteriormente
        """
        # Remover permissões de compartilhamento excessivas
        for acesso in relatorio['detalhes']['acessos_suspeitos']:
            try:
                file_id = acesso['arquivo_id']
                # Remover permissão de compartilhamento público
                self.service.permissions().delete(
                    fileId=file_id,
                    permissionId='anyoneWithLink'
                ).execute()

                self.logger.info(f"Removida permissão pública do arquivo {file_id}")
            except Exception as e:
                self.logger.error(f"Erro ao remover permissão do arquivo {file_id}: {str(e)}")

        # Registrar dados sensíveis encontrados
        for dado in relatorio['detalhes']['dados_sensiveis']:
            self.logger.warning(f"Dado sensível encontrado no arquivo '{dado['nome']}': {dado['motivo']}")


def verificar_seguranca_completa(credentials):
    """
    Função principal para verificar segurança completa do app

    Args:
        credentials: Credenciais OAuth2 para acesso ao Google Drive
    """
    print("Iniciando verificação de segurança completa...")

    seguranca = SegurancaApp(credentials)
    relatorio = seguranca.gerar_relatorio_seguranca()

    print(f"\nRelatório de Segurança:")
    print(f"- Dados sensíveis encontrados: {relatorio['dados_sensiveis_encontrados']}")
    print(f"- Acessos suspeitos: {relatorio['acessos_suspeitos']}")
    print(f"- Problemas de integridade: {relatorio['problemas_integridade']}")

    # Aplicar correções automáticas
    seguranca.aplicar_correcoes_seguranca(relatorio)

    print("\nVerificação de segurança concluída!")
    return relatorio