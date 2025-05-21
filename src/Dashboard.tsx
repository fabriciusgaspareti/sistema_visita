import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Bar } from "react-chartjs-2";
import { Id } from "../convex/_generated/dataModel";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

type FormData = {
  dataVisita: string;
  consultorId: Id<"users"> | null;
  agenciaSolicitante: string;
  empresaProspectada: string;
  contatoEmpresa: string;
  telefoneEmpresa: string;
  emailEmpresa: string;
  observacoes: string;
  status: string;
};

export function Dashboard() {
  const [formData, setFormData] = useState<FormData>({
    dataVisita: "",
    consultorId: null,
    agenciaSolicitante: "",
    empresaProspectada: "",
    contatoEmpresa: "",
    telefoneEmpresa: "",
    emailEmpresa: "",
    observacoes: "",
    status: "negociacao"
  });

  const [editingVisita, setEditingVisita] = useState<Id<"visitas"> | null>(null);
  const [showNewConsultor, setShowNewConsultor] = useState(false);
  const [showNewAgencia, setShowNewAgencia] = useState(false);
  const [showDeleteConsultor, setShowDeleteConsultor] = useState(false);
  const [showDeleteAgencia, setShowDeleteAgencia] = useState(false);
  const [consultorToDelete, setConsultorToDelete] = useState<Id<"users"> | null>(null);
  const [agenciaToDelete, setAgenciaToDelete] = useState<Id<"agencias"> | null>(null);
  const [newConsultor, setNewConsultor] = useState({ name: "" });
  const [newAgencia, setNewAgencia] = useState({ id: "", nome: "" });

  const criarVisita = useMutation(api.visitas.criar);
  const editarVisita = useMutation(api.visitas.editar);
  const excluirVisita = useMutation(api.visitas.excluir);
  const criarConsultor = useMutation(api.visitas.criarConsultor);
  const criarAgencia = useMutation(api.visitas.criarAgencia);
  const excluirConsultor = useMutation(api.visitas.excluirConsultor);
  const excluirAgencia = useMutation(api.visitas.excluirAgencia);
  const visitas = useQuery(api.visitas.listar) || [];
  const consultores = useQuery(api.visitas.listarConsultores) || [];
  const agencias = useQuery(api.visitas.listarAgencias) || [];
  
  const hoje = new Date();
  const [selectedMonth, setSelectedMonth] = useState((hoje.getMonth() + 1).toString().padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(hoje.getFullYear().toString());
  
  const stats = useQuery(api.visitas.estatisticas, {
    ano: selectedYear,
    mes: selectedMonth
  }) || { negociacao: 0, andamento: 0, negado: 0, fechado: 0, jaCliente: 0 };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.consultorId) {
      alert("Por favor, selecione um consultor");
      return;
    }

    // Solução mais direta para o problema de fuso horário
    // Adiciona 1 dia à data selecionada para compensar o ajuste automático
    let dataVisitaCorrigida = formData.dataVisita;
    
    if (dataVisitaCorrigida) {
      const [ano, mes, dia] = dataVisitaCorrigida.split('-').map(Number);
      // Adiciona 1 dia para compensar o ajuste de fuso horário
      const dataPlusOne = new Date(ano, mes - 1, dia + 1);
      const anoCorrigido = dataPlusOne.getFullYear();
      const mesCorrigido = (dataPlusOne.getMonth() + 1).toString().padStart(2, '0');
      const diaCorrigido = dataPlusOne.getDate().toString().padStart(2, '0');
      dataVisitaCorrigida = `${anoCorrigido}-${mesCorrigido}-${diaCorrigido}`;
    }
    
    if (editingVisita) {
      await editarVisita({
        id: editingVisita,
        ...formData,
        dataVisita: dataVisitaCorrigida,
        consultorId: formData.consultorId,
      });
      setEditingVisita(null);
    } else {
      await criarVisita({
        ...formData,
        dataVisita: dataVisitaCorrigida,
        consultorId: formData.consultorId,
      });
    }

    setFormData({
      dataVisita: "",
      consultorId: null,
      agenciaSolicitante: "",
      empresaProspectada: "",
      contatoEmpresa: "",
      telefoneEmpresa: "",
      emailEmpresa: "",
      observacoes: "",
      status: "negociacao"
    });
  };

  const handleNewConsultor = async (e: React.FormEvent) => {
    e.preventDefault();
    await criarConsultor(newConsultor);
    setNewConsultor({ name: "" });
    setShowNewConsultor(false);
  };

  const handleNewAgencia = async (e: React.FormEvent) => {
    e.preventDefault();
    await criarAgencia(newAgencia);
    setNewAgencia({ id: "", nome: "" });
    setShowNewAgencia(false);
  };

  const handleDeleteConsultor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (consultorToDelete) {
      try {
        const result = await excluirConsultor({ id: consultorToDelete });
        setConsultorToDelete(null);
        setShowDeleteConsultor(false);
        
        if (result.visitasAtualizadas > 0) {
          alert(`Consultor excluído com sucesso! ${result.visitasAtualizadas} visita(s) foram desvinculadas.`);
        } else {
          alert("Consultor excluído com sucesso!");
        }
      } catch (error) {
        alert("Erro ao excluir consultor: " + (error as Error).message);
      }
    }
  };

  const handleDeleteAgencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (agenciaToDelete) {
      try {
        const result = await excluirAgencia({ id: agenciaToDelete });
        setAgenciaToDelete(null);
        setShowDeleteAgencia(false);
        
        if (result.visitasAtualizadas > 0) {
          alert(`Agência excluída com sucesso! ${result.visitasAtualizadas} visita(s) foram desvinculadas.`);
        } else {
          alert("Agência excluída com sucesso!");
        }
      } catch (error) {
        alert("Erro ao excluir agência: " + (error as Error).message);
      }
    }
  };

  const handleEdit = (visita: any) => {
    // Ajuste para exibir a data correta ao editar
    let dataVisitaCorrigida = visita.dataVisita;
    
    if (dataVisitaCorrigida) {
      const [ano, mes, dia] = dataVisitaCorrigida.split('-').map(Number);
      // Subtrai 1 dia para compensar o ajuste que foi feito ao salvar
      const dataMinusOne = new Date(ano, mes - 1, dia - 1);
      const anoCorrigido = dataMinusOne.getFullYear();
      const mesCorrigido = (dataMinusOne.getMonth() + 1).toString().padStart(2, '0');
      const diaCorrigido = dataMinusOne.getDate().toString().padStart(2, '0');
      dataVisitaCorrigida = `${anoCorrigido}-${mesCorrigido}-${diaCorrigido}`;
    }
    
    setEditingVisita(visita._id);
    setFormData({
      dataVisita: dataVisitaCorrigida,
      consultorId: visita.consultorId,
      agenciaSolicitante: visita.agenciaSolicitante,
      empresaProspectada: visita.empresaProspectada,
      contatoEmpresa: visita.contatoEmpresa,
      telefoneEmpresa: visita.telefoneEmpresa,
      emailEmpresa: visita.emailEmpresa,
      observacoes: visita.observacoes,
      status: visita.status.toLowerCase().replace(/\s+/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: Id<"visitas">) => {
    if (confirm("Tem certeza que deseja excluir esta visita?")) {
      await excluirVisita({ id });
      
      // Verifica se a visita que está sendo excluída é a mesma que está sendo editada
      if (editingVisita === id) {
        // Limpa o formulário e reseta o estado de edição
        setEditingVisita(null);
        setFormData({
          dataVisita: "",
          consultorId: null,
          agenciaSolicitante: "",
          empresaProspectada: "",
          contatoEmpresa: "",
          telefoneEmpresa: "",
          emailEmpresa: "",
          observacoes: "",
          status: "negociacao"
        });
      }
    }
  };

  const chartData = {
    labels: ['Negociação', 'Andamento', 'Negado', 'Fechado', 'Já é Cliente'],
    datasets: [
      {
        label: 'Status das Visitas',
        data: [
          stats.negociacao,
          stats.andamento,
          stats.negado,
          stats.fechado,
          stats.jaCliente
        ],
        backgroundColor: [
          'rgba(255, 140, 0, 0.7)',  // Laranja para Negociação
          'rgba(255, 205, 0, 0.7)',  // Amarelo para Andamento
          'rgba(255, 0, 0, 0.7)',    // Vermelho para Negado
          'rgba(34, 197, 94, 0.7)',  // Verde para Fechado
          'rgba(96, 165, 250, 0.7)', // Azul claro para Já é Cliente
        ],
        borderColor: [
          'rgb(255, 140, 0)',        // Laranja
          'rgb(255, 205, 0)',        // Amarelo
          'rgb(255, 0, 0)',          // Vermelho
          'rgb(34, 197, 94)',        // Verde
          'rgb(96, 165, 250)',       // Azul claro
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="w-full mb-8 bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <div className="visita-form">
          <h1 className="text-xl font-medium text-gray-900 mb-4">Cadastro de Visita</h1>
          <form onSubmit={handleSubmit} className="p-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Data da Visita</label>
                <input
                  type="date"
                  value={formData.dataVisita}
                  onChange={(e) => setFormData({ ...formData, dataVisita: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* O campo "Consultor" duplicado e incorreto que estava aqui foi removido. */}

              <div>
                <label className="block text-sm font-medium text-gray-700">Consultor</label>
                <div className="flex items-center gap-2">
                  <select
                    value={formData.consultorId || ""}
                    onChange={(e) => setFormData({ ...formData, consultorId: e.target.value ? e.target.value as Id<"users"> : null })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Selecione um consultor</option>
                    {consultores
                      .filter(consultor => consultor.name && consultor.name.trim() !== "") // Filtra consultores com nome vazio
                      .map((consultor) => (
                        <option key={consultor._id} value={consultor._id}>
                          {consultor.name}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewConsultor(true)}
                    className="mt-1 inline-flex items-center justify-center w-10 h-10 text-sm font-medium text-white bg-[#175C7D] rounded hover:bg-[#124B66]"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConsultor(true)}
                    className="mt-1 inline-flex items-center justify-center w-10 h-10 text-sm font-medium text-white bg-[#175C7D] rounded hover:bg-[#124B66]"
                  >
                    -
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Agência Solicitante</label>
                <div className="flex items-center gap-2">
                  <select
                    value={formData.agenciaSolicitante}
                    onChange={(e) => setFormData({ ...formData, agenciaSolicitante: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Selecione uma agência</option>
                    {agencias.map((agencia) => (
                      <option key={agencia._id} value={agencia.id}>
                        {agencia.nome}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewAgencia(true)}
                    className="mt-1 inline-flex items-center justify-center w-10 h-10 text-sm font-medium text-white bg-[#175C7D] rounded hover:bg-[#124B66]"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteAgencia(true)}
                    className="mt-1 inline-flex items-center justify-center w-10 h-10 text-sm font-medium text-white bg-[#175C7D] rounded hover:bg-[#124B66]"
                  >
                    -
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Empresa Prospectada</label>
                <input
                  type="text"
                  value={formData.empresaProspectada}
                  onChange={(e) => setFormData({ ...formData, empresaProspectada: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Contato na Empresa</label>
                <input
                  type="text"
                  value={formData.contatoEmpresa}
                  onChange={(e) => setFormData({ ...formData, contatoEmpresa: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Telefone</label>
                <input
                  type="tel"
                  value={formData.telefoneEmpresa}
                  onChange={(e) => setFormData({ ...formData, telefoneEmpresa: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">E-mail</label>
                <input
                  type="email"
                  value={formData.emailEmpresa}
                  onChange={(e) => setFormData({ ...formData, emailEmpresa: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                >
                  <option value="negociacao">Negociação</option>
                  <option value="andamento">Andamento</option>
                  <option value="negado">Negado</option>
                  <option value="fechado">Fechado</option>
                  <option value="jacliente">Já é Cliente</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Observações</label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg transition-colors bg-[#175C7D] hover:bg-[#124B66] text-white w-auto max-w-xs"
              >
                {editingVisita ? "Atualizar" : "Cadastrar Visita"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showNewConsultor && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 transition-opacity">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm transform transition-all">
            <h3 className="text-lg font-medium text-gray-900 p-4 border-b">Novo Consultor</h3>
            <form onSubmit={handleNewConsultor} className="p-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Consultor</label>
                <input
                  type="text"
                  value={newConsultor.name}
                  onChange={(e) => setNewConsultor({ name: e.target.value })}
                  className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowNewConsultor(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-[#175C7D] rounded hover:bg-[#124B66]"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNewAgencia && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 transition-opacity">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm transform transition-all">
            <h3 className="text-lg font-medium text-gray-900 p-4 border-b">Nova Agência</h3>
            <form onSubmit={handleNewAgencia} className="p-5">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Código</label>
                  <input
                    type="text"
                    value={newAgencia.id}
                    onChange={(e) => setNewAgencia({ ...newAgencia, id: e.target.value })}
                    className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                  <input
                    type="text"
                    value={newAgencia.nome}
                    onChange={(e) => setNewAgencia({ ...newAgencia, nome: e.target.value })}
                    className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowNewAgencia(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-[#175C7D] rounded hover:bg-[#124B66]"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConsultor && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 transition-opacity">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm transform transition-all">
            <h3 className="text-lg font-medium text-gray-900 p-4 border-b">Excluir Consultor</h3>
            <form onSubmit={handleDeleteConsultor} className="p-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Selecione o Consultor</label>
                <select
                  value={consultorToDelete || ""}
                  onChange={(e) => setConsultorToDelete(e.target.value ? e.target.value as Id<"users"> : null)}
                  className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  required
                >
                  <option value="">Selecione um consultor</option>
                  {consultores
                    .filter(consultor => consultor.name && consultor.name.trim() !== "") // Adicionado filtro aqui
                    .map((consultor) => (
                      <option key={consultor._id} value={consultor._id}>
                        {consultor.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowDeleteConsultor(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-[#175C7D] rounded hover:bg-[#124B66]"
                  disabled={!consultorToDelete}
                >
                  Excluir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteAgencia && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 transition-opacity">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm transform transition-all">
            <h3 className="text-lg font-medium text-gray-900 p-4 border-b">Excluir Agência</h3>
            <form onSubmit={handleDeleteAgencia} className="p-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Selecione a Agência</label>
                <select
                  value={agenciaToDelete || ""}
                  onChange={(e) => setAgenciaToDelete(e.target.value as Id<"agencias">)}
                  className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  required
                >
                  <option value="">Selecione uma agência</option>
                  {agencias.map((agencia) => (
                    <option key={agencia._id} value={agencia._id}>
                      {agencia.nome} ({agencia.id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowDeleteAgencia(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-[#175C7D] rounded hover:bg-[#124B66]"
                  disabled={!agenciaToDelete}
                >
                  Excluir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mb-8 bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <h2 className="text-xl font-medium text-gray-900 mb-4">Estatísticas do Mês</h2>
        <div className="flex gap-4 mb-4">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                {new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            {Array.from({ length: 10 }, (_, i) => (
              <option key={hoje.getFullYear() - 5 + i} value={hoje.getFullYear() - 5 + i}>
                {hoje.getFullYear() - 5 + i}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-md font-medium text-gray-700 mb-4 text-center">Status das Visitas</h3>
            <div style={{ height: '350px' }}>
              <Bar data={chartData} options={{ 
                maintainAspectRatio: false, 
                responsive: true,
                plugins: {
                  legend: {
                    display: false
                  },
                  tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    padding: 10,
                    cornerRadius: 4
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(0,0,0,0.05)'
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    }
                  }
                }
              }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-orange-100 p-5 rounded-lg shadow text-center hover:shadow-md transition-shadow">
              <p className="text-sm font-medium text-orange-700 mb-2">Negociação</p>
              <p className="text-4xl font-bold text-orange-700">{stats.negociacao}</p>
            </div>
            <div className="bg-yellow-100 p-5 rounded-lg shadow text-center hover:shadow-md transition-shadow">
              <p className="text-sm font-medium text-yellow-700 mb-2">Andamento</p>
              <p className="text-4xl font-bold text-yellow-700">{stats.andamento}</p>
            </div>
            <div className="bg-red-100 p-5 rounded-lg shadow text-center hover:shadow-md transition-shadow">
              <p className="text-sm font-medium text-red-700 mb-2">Negado</p>
              <p className="text-4xl font-bold text-red-700">{stats.negado}</p>
            </div>
            <div className="bg-green-100 p-5 rounded-lg shadow text-center hover:shadow-md transition-shadow">
              <p className="text-sm font-medium text-green-700 mb-2">Fechado</p>
              <p className="text-4xl font-bold text-green-700">{stats.fechado}</p>
            </div>
            <div className="bg-blue-100 p-5 rounded-lg shadow text-center col-span-2 md:col-span-1 hover:shadow-md transition-shadow">
              <p className="text-sm font-medium text-blue-700 mb-2">Já é Cliente</p>
              <p className="text-4xl font-bold text-blue-700">{stats.jaCliente}</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-right">
          Dados referentes a {new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1).toLocaleString('pt-BR', { month: 'long' })} de {selectedYear}
        </p>
      </div>

      {/* Tabela de Visitas - Container separado */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <h2 className="text-xl font-medium text-gray-900 mb-4">Visitas Cadastradas</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consultor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agência</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {visitas.map((visita) => (
                <tr key={visita._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(visita.dataVisita).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{visita.consultorNome}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{visita.agenciaSolicitante}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{visita.empresaProspectada}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${getStatusStyle(visita.status)}`}>
                    {getStatusDisplay(visita.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <button
                      onClick={() => handleEdit(visita)}
                      className="text-[#175C7D] hover:text-[#124B66] mr-4"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(visita._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const getStatusStyle = (status: string) => {
  const styles = {
    negociacao: 'bg-orange-100 text-orange-700',
    andamento: 'bg-yellow-100 text-yellow-700',
    negado: 'bg-red-100 text-red-700',
    fechado: 'bg-green-100 text-green-700',
    jacliente: 'bg-blue-100 text-blue-700'  // Ajustado para corresponder ao valor do banco
  };
  return styles[status.toLowerCase()] || '';
};

const getStatusDisplay = (status: string) => {
  const statusMap: { [key: string]: string } = {
    'negociacao': 'Negociação',
    'andamento': 'Andamento',
    'negado': 'Negado',
    'fechado': 'Fechado',
    'jacliente': 'Já é Cliente'
  };
  return statusMap[status.toLowerCase()] || status;
};
