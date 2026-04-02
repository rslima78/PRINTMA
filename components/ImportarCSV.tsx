"use client";
import { useState, useCallback } from "react";
import Papa from "papaparse";

interface Props {
  colunas: string[]; // colunas esperadas no CSV
  onImportar: (items: Record<string, string>[]) => Promise<void>;
  exemplo?: string; // string de exemplo CSV
}

export function ImportarCSV({ colunas, onImportar, exemplo }: Props) {
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const handleFile = useCallback((file: File) => {
    setErro("");
    setSucesso("");
    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const data = result.data as Record<string, string>[];
        // Validar colunas
        if (data.length === 0) {
          setErro("Arquivo CSV vazio");
          return;
        }
        const colunasArquivo = Object.keys(data[0]);
        const faltando = colunas.filter((c) => !colunasArquivo.includes(c));
        if (faltando.length > 0) {
          setErro(`Colunas ausentes no CSV: ${faltando.join(", ")}`);
          return;
        }
        setPreview(data.slice(0, 10));
      },
      error: () => setErro("Erro ao ler arquivo CSV"),
    });
  }, [colunas]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleConfirmar = async () => {
    if (preview.length === 0) return;
    setLoading(true);
    try {
      await onImportar(preview);
      setSucesso(`${preview.length} itens importados com sucesso!`);
      setPreview([]);
      setFileName("");
    } catch (e: any) {
      setErro(e.message || "Erro ao importar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-indigo-300 rounded-xl p-6 text-center hover:border-indigo-500 transition-colors bg-indigo-50/50 cursor-pointer"
        onClick={() => document.getElementById("csv-input")?.click()}
      >
        <p className="text-2xl mb-2">📁</p>
        <p className="text-sm text-gray-600">Arraste um arquivo CSV ou <span className="text-indigo-600 font-semibold">clique para selecionar</span></p>
        <p className="text-xs text-gray-400 mt-1">Colunas obrigatórias: <code className="bg-gray-100 px-1 rounded">{colunas.join(", ")}</code></p>
        {fileName && <p className="text-sm text-indigo-700 mt-2 font-medium">📄 {fileName}</p>}
        <input
          id="csv-input"
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{erro}</p>}
      {sucesso && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-2">{sucesso}</p>}

      {preview.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-600 mb-2">Preview ({preview.length} registros):</p>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="text-xs w-full">
              <thead className="bg-gray-50">
                <tr>
                  {colunas.map((c) => (
                    <th key={c} className="text-left px-3 py-2 font-medium text-gray-600">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                    {colunas.map((c) => (
                      <td key={c} className="px-3 py-1.5 text-gray-700">{row[c]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={handleConfirmar}
            disabled={loading}
            className="mt-3 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Importando..." : `✓ Confirmar Importação (${preview.length})`}
          </button>
        </div>
      )}
    </div>
  );
}
