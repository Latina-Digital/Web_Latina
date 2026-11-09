import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Edit3,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Layers,
  Minus,
  Package,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Video,
  X,
} from 'lucide-react';
import {
  CompanyBrand,
  InventoryItem,
  ProductPresentationPrice,
  ProductTechnicalSheet,
  UserRole,
} from '../types/erp';
import { getPermissionsForRole } from '../utils/erpLogic';
import { exportDataset } from '../utils/downloadHelper';
import {
  downloadMinimalistCatalogPdf,
  generateMinimalistCatalogExecutiveHtml,
} from '../utils/executiveDocumentGenerator';
import { ExecutiveDocumentPreviewModal } from './ExecutiveDocumentPreviewModal';

interface InventoryViewProps {
  inventory: InventoryItem[];
  currentRole: UserRole;
  onAdjustStock: (itemId: string, delta: number) => void;
  onCreateInventoryItem: (newItem: {
    sku: string;
    name: string;
    category: string;
    warehouse: string;
    stock: number;
    minStock: number;
    unitPrice: number;
    unit: string;
    company?: CompanyBrand;
    description?: string;
    imageUrl?: string;
    videoUrl?: string;
    presentations?: ProductPresentationPrice[];
    technicalSheet?: ProductTechnicalSheet;
  }) => void;
  onUpdateInventoryItem: (updatedItem: InventoryItem) => void;
  onStatusBanner: (msg: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  currentRole,
  onAdjustStock,
  onCreateInventoryItem,
  onUpdateInventoryItem,
  onStatusBanner,
}) => {
  const permissions = getPermissionsForRole(currentRole);

  const [searchQuery, setSearchQuery] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('todos');
  const [companyFilter, setCompanyFilter] = useState<'todos' | CompanyBrand>('todos');
  const [onlyCritical, setOnlyCritical] = useState(false);

  // Modal State for Add / Edit Product
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'media' | 'technical' | 'presentations'>('general');

  // Form Fields
  const [formSku, setFormSku] = useState('');
  const [formName, setFormName] = useState('');
  const [formCompany, setFormCompany] = useState<CompanyBrand>('industrial_latina');
  const [formCategory, setFormCategory] = useState('Pinturas Arquitectónicas');
  const [formWarehouse, setFormWarehouse] = useState('Planta Vía a Daule - Guayaquil');
  const [formStock, setFormStock] = useState(50);
  const [formMinStock, setFormMinStock] = useState(15);
  const [formUnitPrice, setFormUnitPrice] = useState(18.5);
  const [formUnit, setFormUnit] = useState('Galón');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formVideoUrl, setFormVideoUrl] = useState('');

  // Technical Sheet Fields
  const [techCatalogCode, setTechCatalogCode] = useState('');
  const [techNormative, setTechNormative] = useState('NTE INEN 2093 / 1544');
  const [techYield, setTechYield] = useState('25 a 30 m² por galón a 2 manos');
  const [techDilution, setTechDilution] = useState('Máximo 10% de agua potable');
  const [techMasterPack, setTechMasterPack] = useState('Caja x 4 galones');
  const [techSurfaces, setTechSurfaces] = useState('Mampostería, hormigón, yeso, fibrocemento');
  const [techGoogleDriveUrl, setTechGoogleDriveUrl] = useState(
    'https://drive.google.com/file/d/1IndLatina_FichaTecnica_Oficial/view?usp=sharing'
  );
  const [techHighlights, setTechHighlights] = useState<string[]>([
    'Lavabilidad superior con más de 20,000 ciclos',
    'Acabado mate de alta tersura y bajo olor',
    'Certificación de calidad NTE INEN Ecuador',
  ]);
  const [newHighlightInput, setNewHighlightInput] = useState('');

  // Presentations with Individual Prices & Images
  const [presentationsList, setPresentationsList] = useState<ProductPresentationPrice[]>([]);

  const [formError, setFormError] = useState<string | null>(null);
  const [catalogPdfPreviewHtml, setCatalogPdfPreviewHtml] = useState<string | null>(null);

  const warehouses = Array.from(new Set(inventory.map((i) => i.warehouse)));

  const filteredItems = inventory.filter((item) => {
    const matchesWarehouse = warehouseFilter === 'todos' || item.warehouse === warehouseFilter;
    const matchesCompany = companyFilter === 'todos' || item.company === companyFilter;
    const matchesCritical = !onlyCritical || item.stock <= item.minStock;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      item.sku.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q));
    return matchesWarehouse && matchesCompany && matchesCritical && matchesQuery;
  });

  // Open Modal for Creating a New Product
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormSku('');
    setFormName('');
    setFormCompany('industrial_latina');
    setFormCategory('Pinturas Arquitectónicas');
    setFormWarehouse('Planta Vía a Daule - Guayaquil');
    setFormStock(50);
    setFormMinStock(15);
    setFormUnitPrice(22.5);
    setFormUnit('Galón');
    setFormDescription('');
    setFormImageUrl('');
    setFormVideoUrl('');
    setTechCatalogCode('');
    setTechNormative('NTE INEN 2093 / 1544');
    setTechYield('25 a 30 m² por galón a 2 manos');
    setTechDilution('Máximo 10% con agua limpia');
    setTechMasterPack('Caja x 4 galones');
    setTechSurfaces('Mampostería, yeso, hormigón');
    setTechGoogleDriveUrl('https://drive.google.com/file/d/1IndLatina_FichaTecnica_Oficial/view?usp=sharing');
    setTechHighlights([
      'Certificación NTE INEN de alta lavabilidad',
      'Protección antifúngica y bactericida',
      'Garantía de rendimiento en obra',
    ]);
    setPresentationsList([
      {
        name: 'Litro',
        unitPrice: 6.5,
        skuSuffix: '-LT',
        description: 'Rinde 6 a 8 m²',
        imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Galón',
        unitPrice: 22.5,
        skuSuffix: '-GL',
        description: 'Rinde 25 a 30 m²',
        imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Caneca (5 Galones)',
        unitPrice: 98.0,
        skuSuffix: '-CAN',
        description: 'Rinde 120 a 140 m²',
        imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
      },
    ]);
    setFormError(null);
    setActiveTab('general');
    setIsEditorOpen(true);
  };

  // Open Modal for Editing an Existing Product
  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormSku(item.sku);
    setFormName(item.name);
    setFormCompany(item.company || 'industrial_latina');
    setFormCategory(item.category);
    setFormWarehouse(item.warehouse);
    setFormStock(item.stock);
    setFormMinStock(item.minStock);
    setFormUnitPrice(item.unitPrice);
    setFormUnit(item.unit);
    setFormDescription(item.description || '');
    setFormImageUrl(item.imageUrl || '');
    setFormVideoUrl(item.videoUrl || '');

    // Technical Sheet
    if (item.technicalSheet) {
      setTechCatalogCode(item.technicalSheet.catalogCode || item.sku);
      setTechNormative(item.technicalSheet.normative || 'NTE INEN 2093');
      setTechYield(item.technicalSheet.yieldOrCoverage || '');
      setTechDilution(item.technicalSheet.dilutionOrMix || '');
      setTechMasterPack(item.technicalSheet.masterPack || '');
      setTechSurfaces(
        item.technicalSheet.recommendedSurfaces?.join(', ') ||
          item.technicalSheet.applicationSurface ||
          ''
      );
      setTechGoogleDriveUrl(
        item.technicalSheet.googleDriveUrl ||
          `https://drive.google.com/file/d/1IndLatina_${item.sku}_FichaTecnica/view?usp=sharing`
      );
      setTechHighlights(item.technicalSheet.highlights || []);
    } else {
      setTechCatalogCode(item.sku);
      setTechNormative('NTE INEN Ecuador');
      setTechYield('');
      setTechDilution('');
      setTechMasterPack('');
      setTechSurfaces('');
      setTechGoogleDriveUrl(`https://drive.google.com/file/d/1IndLatina_${item.sku}_FichaTecnica/view?usp=sharing`);
      setTechHighlights([]);
    }

    // Presentations with Prices
    if (item.presentations && item.presentations.length > 0) {
      setPresentationsList(item.presentations);
    } else if (item.technicalSheet?.presentationOptions && item.technicalSheet.presentationOptions.length > 0) {
      // Migrate presentationOptions names with base price
      setPresentationsList(
        item.technicalSheet.presentationOptions.map((optName, idx) => ({
          name: optName,
          unitPrice: idx === 0 ? item.unitPrice : Math.round(item.unitPrice * (idx + 1) * 0.95 * 100) / 100,
          description: `Presentación estándar ${optName}`,
        }))
      );
    } else {
      setPresentationsList([
        { name: item.unit, unitPrice: item.unitPrice, description: `Presentación base estándar` },
      ]);
    }

    setFormError(null);
    setActiveTab('general');
    setIsEditorOpen(true);
  };

  // Quick Preset Helper for Presentations
  const handleApplyPresetPresentations = (type: 'paint' | 'hardware' | 'electric') => {
    if (type === 'paint') {
      const base = Number(formUnitPrice) || 20;
      setPresentationsList([
        { name: 'Litro', unitPrice: Math.round(base * 0.32 * 100) / 100, skuSuffix: '-LT', description: 'Rinde 6 a 8 m²' },
        { name: 'Galón', unitPrice: base, skuSuffix: '-GL', description: 'Rinde 25 a 30 m²' },
        { name: 'Caneca (5 Galones)', unitPrice: Math.round(base * 4.6 * 100) / 100, skuSuffix: '-CAN', description: 'Rinde 120 a 140 m²' },
        { name: 'Tanque 55 Galones', unitPrice: Math.round(base * 46 * 100) / 100, skuSuffix: '-TNQ', description: 'Granel para obra civil' },
      ]);
    } else if (type === 'electric') {
      const base = Number(formUnitPrice) || 12;
      setPresentationsList([
        { name: 'Rollo 100 Metros', unitPrice: base, skuSuffix: '-R100', description: 'Conductor CONDEX' },
        { name: 'Bobina 500 Metros', unitPrice: Math.round(base * 4.8 * 100) / 100, skuSuffix: '-B500', description: 'Bobina industrial' },
      ]);
    } else {
      const base = Number(formUnitPrice) || 10;
      setPresentationsList([
        { name: 'Unidad Individual', unitPrice: base, skuSuffix: '-UND', description: 'Empaque unitario' },
        { name: 'Caja Master (x12 Und)', unitPrice: Math.round(base * 11.2 * 100) / 100, skuSuffix: '-CX12', description: 'Empaque de distribución' },
      ]);
    }
  };

  // Add / Remove Presentations
  const handleAddPresentationRow = () => {
    setPresentationsList((prev) => [
      ...prev,
      {
        name: `Nueva Presentación ${prev.length + 1}`,
        unitPrice: Number(formUnitPrice) || 10,
        skuSuffix: '',
        description: '',
        imageUrl: formImageUrl || 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',
      },
    ]);
  };

  const handleUpdatePresentationRow = (
    index: number,
    field: keyof ProductPresentationPrice,
    value: string | number
  ) => {
    setPresentationsList((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handlePresentationImageUpload = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setFormError('La imagen de presentación supera los 4MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleUpdatePresentationRow(index, 'imageUrl', reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePresentationRow = (index: number) => {
    setPresentationsList((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Add / Remove Highlights
  const handleAddHighlight = () => {
    if (!newHighlightInput.trim()) return;
    setTechHighlights((prev) => [...prev, newHighlightInput.trim()]);
    setNewHighlightInput('');
  };

  const handleRemoveHighlight = (index: number) => {
    setTechHighlights((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Handle Local File Upload (Image)
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      setFormError('La imagen seleccionada supera los 4MB. Por favor elija una imagen más liviana.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Form Submit (Save / Update)
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!permissions.canEditInventory) {
      setFormError('Su rol actual no tiene permisos para modificar o agregar productos al catálogo.');
      return;
    }

    const cleanSku = formSku.trim().toUpperCase();
    const cleanName = formName.trim();

    if (cleanSku.length < 3 || !/^[A-Z0-9_-]+$/.test(cleanSku)) {
      setFormError('El código SKU debe tener al menos 3 caracteres alfanuméricos o guiones (ej. LAT-DUR-01).');
      return;
    }
    if (cleanName.length < 3) {
      setFormError('Ingrese un nombre comercial y descriptivo para el producto.');
      return;
    }

    const compiledTechSheet: ProductTechnicalSheet = {
      catalogCode: techCatalogCode.trim() || cleanSku,
      normative: techNormative.trim() || 'NTE INEN Ecuador',
      yieldOrCoverage: techYield.trim() || 'Ver especificaciones de etiqueta',
      dilutionOrMix: techDilution.trim() || 'Listo para usar o dilución máx 10%',
      masterPack: techMasterPack.trim() || 'Empaque estándar',
      applicationSurface: techSurfaces.trim() || 'Mampostería, hormigón, yeso',
      recommendedSurfaces: techSurfaces
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      highlights: techHighlights,
      googleDriveUrl:
        techGoogleDriveUrl.trim() ||
        `https://drive.google.com/file/d/1IndLatina_${cleanSku}_FichaTecnica/view?usp=sharing`,
      presentationOptions:
        presentationsList.length > 0
          ? presentationsList.map((p) => p.name)
          : [formUnit],
    };

    if (editingItem) {
      // Update existing item
      const updated: InventoryItem = {
        ...editingItem,
        sku: cleanSku,
        name: cleanName,
        company: formCompany,
        category: formCategory,
        warehouse: formWarehouse,
        stock: Number(formStock) || 0,
        minStock: Number(formMinStock) || 5,
        unitPrice: Number(formUnitPrice) || 1,
        unit: formUnit,
        description: formDescription.trim(),
        imageUrl: formImageUrl.trim(),
        videoUrl: formVideoUrl.trim(),
        presentations: presentationsList,
        technicalSheet: compiledTechSheet,
      };

      onUpdateInventoryItem(updated);
      setIsEditorOpen(false);
      onStatusBanner(`Producto ${cleanSku} (${cleanName}) actualizado con éxito en el catálogo.`);
    } else {
      // Check duplicate SKU
      if (inventory.some((i) => i.sku.toUpperCase() === cleanSku)) {
        setFormError(`Ya existe un producto con el código SKU ${cleanSku}. Modifique el SKU o edite el producto existente.`);
        return;
      }

      onCreateInventoryItem({
        sku: cleanSku,
        name: cleanName,
        company: formCompany,
        category: formCategory,
        warehouse: formWarehouse,
        stock: Number(formStock) || 0,
        minStock: Number(formMinStock) || 5,
        unitPrice: Number(formUnitPrice) || 1,
        unit: formUnit,
        description: formDescription.trim(),
        imageUrl: formImageUrl.trim(),
        videoUrl: formVideoUrl.trim(),
        presentations: presentationsList,
        technicalSheet: compiledTechSheet,
      });

      setIsEditorOpen(false);
      onStatusBanner(`Nuevo producto ${cleanSku} incorporado al catálogo con sus presentaciones y fichas técnicas.`);
    }
  };

  // Export Inventory Reports
  const handleExportInventory = (format: 'pdf' | 'excel' | 'csv') => {
    const headers = [
      'SKU',
      'Empresa',
      'Descripcion Comercial',
      'Categoria',
      'Almacen',
      'Stock Actual',
      'Stock Minimo',
      'Unidad Base',
      'Precio Base USD',
      'Presentaciones y Precios',
      'Valor Total Stock USD',
    ];
    const rows = filteredItems.map((i) => [
      i.sku,
      i.company === 'induless' ? 'Induless' : 'Industrial Latina',
      i.name,
      i.category,
      i.warehouse,
      i.stock,
      i.minStock,
      i.unit,
      i.unitPrice,
      (i.presentations || []).map((p) => `${p.name}: $${p.unitPrice.toFixed(2)}`).join(' | ') || `${i.unit}: $${i.unitPrice.toFixed(2)}`,
      i.stock * i.unitPrice,
    ]);
    const filename = exportDataset(
      format,
      'inventario_catalogo_industrial_latina',
      'Industrial Latina & Induless - Catálogo General e Inventario Valorizado',
      `Referencias activas: ${filteredItems.length}`,
      headers,
      rows
    );
    onStatusBanner(`Catálogo e inventario exportado en ${format.toUpperCase()}: ${filename}`);
  };

  return (
    <div className="space-y-8">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-[#0B2861] text-[#FFD100]">
              Gestión Integral ERP
            </span>
            <span className="text-xs font-medium text-slate-500">
              Catálogo General · Presentaciones con Precios · Fichas Técnicas &amp; Multimedia
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Inventario y Catálogo Maestro de Productos
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            data-testid="erp-minimalist-catalog-pdf-btn"
            onClick={() => {
              const html = generateMinimalistCatalogExecutiveHtml(filteredItems);
              setCatalogPdfPreviewHtml(html);
              downloadMinimalistCatalogPdf(filteredItems);
              onStatusBanner(
                `Catálogo Corporativo Minimalista PDF generado (${filteredItems.length} productos + portada ejecutiva + páginas de combinación de colores en ambiente real para Pinturas).`
              );
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold text-slate-950 bg-[#FFD100] hover:bg-amber-400 rounded-xl transition-all shadow-md cursor-pointer whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-4 h-4 text-[#0B2861]" />
            <span>Catálogo PDF Minimalista (Portada + Productos + Ambientes Pintura)</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold text-white bg-[#0B2861] hover:bg-blue-900 rounded-xl transition-all shadow-md cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 text-[#FFD100]" />
            <span>+ Agregar Producto al Catálogo</span>
          </button>

          <button
            type="button"
            onClick={() => handleExportInventory('pdf')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <FileText className="w-3.5 h-3.5" />
            PDF
          </button>
          <button
            type="button"
            onClick={() => handleExportInventory('excel')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            Excel
          </button>
          <button
            type="button"
            onClick={() => handleExportInventory('csv')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            CSV
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Company Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setCompanyFilter('todos')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                companyFilter === 'todos'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({inventory.length})
            </button>
            <button
              type="button"
              onClick={() => setCompanyFilter('industrial_latina')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                companyFilter === 'industrial_latina'
                  ? 'bg-[#0B2861] text-[#FFD100] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Industrial Latina
            </button>
            <button
              type="button"
              onClick={() => setCompanyFilter('induless')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                companyFilter === 'induless'
                  ? 'bg-[#D8235A] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Induless
            </button>
          </div>

          {/* Warehouse Filter */}
          <select
            aria-label="Filtrar por centro logístico"
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
          >
            <option value="todos">Todos los Almacenes / Plantas</option>
            {warehouses.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>

          {/* Stock Alert Switcher */}
          <button
            type="button"
            onClick={() => setOnlyCritical(!onlyCritical)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
              onlyCritical
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            Solo Alerta de Reorden
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por SKU, producto, categoría..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B2861]"
          />
        </div>
      </div>

      {/* Main Inventory & Catalog Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold text-slate-700">
                <th className="py-3.5 px-4">Producto &amp; SKU</th>
                <th className="py-3.5 px-3">Empresa &amp; Cat.</th>
                <th className="py-3.5 px-3">Centro / Planta</th>
                <th className="py-3.5 px-4">Presentaciones &amp; Precios Individuales</th>
                <th className="py-3.5 px-3 text-right">Existencia</th>
                <th className="py-3.5 px-3 text-right">Precio Base</th>
                <th className="py-3.5 px-3 text-right">Valorizado</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No se encontraron productos que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLow = item.stock <= item.minStock;
                  const isInduless = item.company === 'induless';
                  const hasPresentations = item.presentations && item.presentations.length > 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Product Name & SKU */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-11 h-11 object-cover rounded-lg border border-slate-200 shrink-0 bg-white"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 line-clamp-1">{item.name}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                                {item.sku}
                              </span>
                              {item.videoUrl && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-semibold">
                                  <Video className="w-3 h-3" /> Video
                                </span>
                              )}
                              {item.technicalSheet && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold">
                                  <FileText className="w-3 h-3" /> Ficha OK
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Company & Category */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                            isInduless
                              ? 'bg-pink-100 text-[#D8235A]'
                              : 'bg-blue-100 text-[#0B2861]'
                          }`}
                        >
                          {isInduless ? 'Induless' : 'Industrial Latina'}
                        </span>
                        <div className="text-slate-500 text-[11px] mt-0.5">{item.category}</div>
                      </td>

                      {/* Warehouse */}
                      <td className="py-3.5 px-3 text-slate-600 text-[11px]">
                        {item.warehouse}
                      </td>

                      {/* Presentations with Prices & Images Column */}
                      <td className="py-3.5 px-4">
                        {hasPresentations ? (
                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                            {item.presentations!.map((p, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-medium"
                              >
                                {p.imageUrl && (
                                  <img
                                    src={p.imageUrl}
                                    alt={p.name}
                                    className="w-4 h-4 rounded-xs object-cover border border-slate-300"
                                  />
                                )}
                                <span className="font-semibold text-slate-900">{p.name}:</span>
                                <span className="font-mono font-bold text-emerald-700">
                                  ${p.unitPrice.toFixed(2)}
                                </span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">
                            Presentación única ({item.unit} a ${item.unitPrice.toFixed(2)})
                          </span>
                        )}
                        {item.technicalSheet?.googleDriveUrl && (
                          <div className="mt-1">
                            <a
                              href={item.technicalSheet.googleDriveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 hover:underline"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                              Ficha Técnica en Google Drive
                            </a>
                          </div>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                        <span className={`font-bold ${isLow ? 'text-amber-700' : 'text-slate-900'}`}>
                          {item.stock} {item.unit}
                        </span>
                        {isLow && (
                          <div className="text-amber-700 font-bold inline-flex items-center gap-1 ml-1.5 text-[10px]">
                            <AlertTriangle className="w-3 h-3" /> Reorden
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400">Mín: {item.minStock}</div>
                      </td>

                      {/* Unit Price */}
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums text-slate-900 font-bold">
                        ${item.unitPrice.toFixed(2)}
                      </td>

                      {/* Stock Value */}
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                        ${(item.stock * item.unitPrice).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-[#0B2861] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                            title="Modificar producto, imágenes, ficha y presentaciones"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Modificar</span>
                          </button>

                          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white">
                            <button
                              type="button"
                              disabled={!permissions.canEditInventory || item.stock <= 0}
                              onClick={() => onAdjustStock(item.id, -1)}
                              aria-label={`Descontar 1 unidad de ${item.sku}`}
                              className="p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40 rounded-l"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={!permissions.canEditInventory}
                              onClick={() => onAdjustStock(item.id, 5)}
                              aria-label={`Ingresar 5 unidades a ${item.sku}`}
                              className="px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 rounded-r border-l border-slate-200"
                            >
                              +5
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          MODAL: AGREGAR O MODIFICAR PRODUCTO DEL CATÁLOGO GENERAL
         ========================================================================= */}
      {isEditorOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] modal-layer-top bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
          style={{ zIndex: 9999 }}
        >
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border-2 border-[#0B2861] overflow-hidden skeuo-modal-3d">
            {/* Modal Header */}
            <div className="bg-[#0B2861] text-white p-5 flex items-center justify-between border-b-4 border-[#FFD100] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#FFD100]">
                  {editingItem ? <Edit3 className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FFD100]">
                    {editingItem ? 'Catálogo General ERP · Edición' : 'Catálogo General ERP · Nuevo Registro'}
                  </span>
                  <h2 className="text-lg font-black font-display leading-tight">
                    {editingItem ? `Modificar: ${editingItem.name}` : 'Dar de Alta Nuevo Producto al Catálogo'}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Subheader Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2 overflow-x-auto shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'general'
                    ? 'border-[#0B2861] text-[#0B2861]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                1. Datos Generales &amp; Stock
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('media')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'media'
                    ? 'border-[#0B2861] text-[#0B2861]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                2. Imagen &amp; Video
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('technical')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'technical'
                    ? 'border-[#0B2861] text-[#0B2861]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                3. Ficha Técnica &amp; Normativa
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('presentations')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'presentations'
                    ? 'border-[#0B2861] text-[#0B2861]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                4. Presentaciones con Precios ({presentationsList.length})
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveProduct} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {formError && (
                  <div
                    role="alert"
                    className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-800 flex items-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* TAB 1: DATOS GENERALES */}
                {activeTab === 'general' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Código SKU *
                        </label>
                        <input
                          type="text"
                          required
                          value={formSku}
                          onChange={(e) => setFormSku(e.target.value)}
                          placeholder="LAT-LVA-01"
                          className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-900 uppercase"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nombre Comercial del Producto *
                        </label>
                        <input
                          type="text"
                          required
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="Duralín Premium Forte / Látex Vinil Acrílico"
                          className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Empresa Matriz *
                        </label>
                        <select
                          value={formCompany}
                          onChange={(e) => setFormCompany(e.target.value as CompanyBrand)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                        >
                          <option value="industrial_latina">Industrial Latina (Pinturas &amp; Químicos)</option>
                          <option value="induless">Induless (Eléctricos, Iluminación &amp; Ferretería)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Categoría Comercial *
                        </label>
                        <select
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                        >
                          <option value="Pinturas Arquitectónicas">Pinturas Arquitectónicas</option>
                          <option value="Impermeabilizantes">Impermeabilizantes y Resinas</option>
                          <option value="Esmaltes y Anticorrosivos">Esmaltes y Anticorrosivos</option>
                          <option value="Morteros y Masillas">Morteros y Masillas</option>
                          <option value="Conductores Eléctricos">Conductores Eléctricos CONDEX</option>
                          <option value="Iluminación LED">Iluminación LED Industrial</option>
                          <option value="Cubiertas y Techos">Cubiertas y TechoForte</option>
                          <option value="Herramientas y Ferretería">Herramientas y Ferretería</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Almacén / Planta Principal *
                        </label>
                        <select
                          value={formWarehouse}
                          onChange={(e) => setFormWarehouse(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                        >
                          <option value="Planta Vía a Daule - Guayaquil">Planta Vía a Daule - Guayaquil</option>
                          <option value="Bodega Mapasingue Este - Induless">Bodega Mapasingue Este - Induless</option>
                          <option value="Hub Logístico Quito Norte">Hub Logístico Quito Norte</option>
                          <option value="Centro Logístico Cuenca">Centro Logístico Cuenca</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Stock Actual
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={formStock}
                          onChange={(e) => setFormStock(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Stock Mín. Reorden
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={formMinStock}
                          onChange={(e) => setFormMinStock(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Precio Base USD *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min={0.01}
                          value={formUnitPrice}
                          onChange={(e) => setFormUnitPrice(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Unidad de Medida *
                        </label>
                        <select
                          value={formUnit}
                          onChange={(e) => setFormUnit(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                        >
                          <option value="Galón">Galón</option>
                          <option value="Litro">Litro</option>
                          <option value="Caneca (5 Gal)">Caneca (5 Gal)</option>
                          <option value="Unidad">Unidad</option>
                          <option value="Rollo 100m">Rollo 100m</option>
                          <option value="Saco 25kg">Saco 25kg</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Descripción Comercial y Aplicaciones del Producto
                      </label>
                      <textarea
                        rows={3}
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="Pintura tipo látex modificada con resina vinil-acrílica para interiores y exteriores. Ofrece acabado mate uniforme, alta resistencia al frote y protección anti-hongos."
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 2: MULTIMEDIA (IMAGEN & VIDEO) */}
                {activeTab === 'media' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Image Upload / Link */}
                      <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-[#0B2861]" />
                          <h3 className="text-xs font-bold text-slate-900 uppercase">
                            Fotografía Oficial del Producto
                          </h3>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            URL directa de la imagen (CDN o Web):
                          </label>
                          <input
                            type="url"
                            value={formImageUrl}
                            onChange={(e) => setFormImageUrl(e.target.value)}
                            placeholder="https://ejemplo.com/producto.jpg"
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                          />
                        </div>

                        <div className="pt-1">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            O cargar archivo de imagen local:
                          </label>
                          <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-[#0B2861] rounded-xl cursor-pointer bg-white transition-colors">
                            <Upload className="w-5 h-5 text-slate-400 mb-1" />
                            <span className="text-xs font-bold text-slate-700">Seleccionar imagen</span>
                            <span className="text-[10px] text-slate-400">PNG, JPG, WEBP hasta 4MB</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageFileUpload}
                              className="hidden"
                            />
                          </label>
                        </div>

                        {/* Image Preview Box */}
                        {formImageUrl ? (
                          <div className="relative mt-2 p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-center">
                            <img
                              src={formImageUrl}
                              alt="Vista previa"
                              className="max-h-44 object-contain rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => setFormImageUrl('')}
                              className="absolute top-3 right-3 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 cursor-pointer shadow-xs"
                              title="Eliminar imagen"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="p-4 bg-white rounded-xl border border-slate-200 text-center text-slate-400 text-xs italic">
                            Sin imagen cargada. Se utilizará el esquema técnico por defecto.
                          </div>
                        )}
                      </div>

                      {/* Video Link / Preview */}
                      <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4 text-[#0B2861]" />
                          <h3 className="text-xs font-bold text-slate-900 uppercase">
                            Video Demostrativo / Aplicación
                          </h3>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Enlace de Video (MP4, YouTube o Vimeo):
                          </label>
                          <input
                            type="url"
                            value={formVideoUrl}
                            onChange={(e) => setFormVideoUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=... o archivo .mp4"
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                          />
                        </div>

                        {formVideoUrl ? (
                          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                            <span className="text-[11px] font-bold text-slate-700 block">
                              Vista Previa de Video:
                            </span>
                            {formVideoUrl.includes('youtube.com') || formVideoUrl.includes('youtu.be') ? (
                              <div className="aspect-video w-full rounded-lg overflow-hidden border border-slate-200">
                                <iframe
                                  src={
                                    formVideoUrl.includes('embed')
                                      ? formVideoUrl
                                      : formVideoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')
                                  }
                                  title="Video del Producto"
                                  className="w-full h-full"
                                  allowFullScreen
                                />
                              </div>
                            ) : (
                              <video
                                src={formVideoUrl}
                                controls
                                className="w-full max-h-44 rounded-lg bg-black"
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => setFormVideoUrl('')}
                              className="text-xs text-red-600 hover:underline font-bold"
                            >
                              Quitar enlace de video
                            </button>
                          </div>
                        ) : (
                          <div className="p-6 bg-white rounded-xl border border-slate-200 text-center text-slate-400 text-xs italic">
                            Opcional: Añada un video para que los clientes vean la aplicación real en el catálogo y ficha técnica.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: FICHA TÉCNICA */}
                {activeTab === 'technical' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Código de Ficha de Catálogo
                        </label>
                        <input
                          type="text"
                          value={techCatalogCode}
                          onChange={(e) => setTechCatalogCode(e.target.value)}
                          placeholder="CAT-LAT-2026-LVA"
                          className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Normativa / Certificación NTE INEN
                        </label>
                        <input
                          type="text"
                          value={techNormative}
                          onChange={(e) => setTechNormative(e.target.value)}
                          placeholder="NTE INEN 2093 / 1544"
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Rendimiento Teórico / Cobertura
                        </label>
                        <input
                          type="text"
                          value={techYield}
                          onChange={(e) => setTechYield(e.target.value)}
                          placeholder="25 a 30 m² por galón a 2 manos"
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Dilución / Preparación de Mezcla
                        </label>
                        <input
                          type="text"
                          value={techDilution}
                          onChange={(e) => setTechDilution(e.target.value)}
                          placeholder="Máximo 10% de agua potable para brocha/rodillo"
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Empaque Master / Presentación de Distribución
                        </label>
                        <input
                          type="text"
                          value={techMasterPack}
                          onChange={(e) => setTechMasterPack(e.target.value)}
                          placeholder="Caja x 4 galones / Pallet x 36 canecas"
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Superficies de Aplicación (separadas por comas)
                        </label>
                        <input
                          type="text"
                          value={techSurfaces}
                          onChange={(e) => setTechSurfaces(e.target.value)}
                          placeholder="Mampostería, yeso, hormigón, enlucido"
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                        />
                      </div>

                      <div className="sm:col-span-2 bg-blue-50/70 p-3.5 rounded-xl border border-blue-200">
                        <label className="block text-xs font-extrabold text-[#0B2861] mb-1">
                          Link de Google Drive para Ficha Técnica Oficial *
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="url"
                            data-testid="tech-sheet-google-drive-input"
                            value={techGoogleDriveUrl}
                            onChange={(e) => setTechGoogleDriveUrl(e.target.value)}
                            placeholder="https://drive.google.com/file/d/1IndLatina_FichaTecnica/view?usp=sharing"
                            className="flex-1 px-3 py-2 text-xs bg-white border border-blue-300 rounded-lg text-slate-900 font-mono"
                          />
                          {techGoogleDriveUrl && (
                            <a
                              href={techGoogleDriveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-[#0B2861] hover:bg-blue-900 rounded-lg whitespace-nowrap"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-[#FFD100]" />
                              Probar Link Google Drive
                            </a>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Cada ficha técnica de producto se conecta directamente a este enlace de Google Drive en el catálogo público y en los documentos ejecutivos.
                        </p>
                      </div>
                    </div>

                    {/* Highlights / Puntos Destacados */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-800">
                          Puntos Destacados de la Ficha Técnica (Highlights):
                        </label>
                        <span className="text-[11px] text-slate-500">
                          {techHighlights.length} atributos registrados
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newHighlightInput}
                          onChange={(e) => setNewHighlightInput(e.target.value)}
                          placeholder="Ej. Resistencia superior de 20,000 ciclos de lavado..."
                          className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={handleAddHighlight}
                          className="px-3 py-1.5 bg-[#0B2861] text-white rounded-lg text-xs font-bold hover:bg-blue-900 cursor-pointer"
                        >
                          + Añadir
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {techHighlights.map((hl, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                          >
                            <span className="text-slate-800 font-medium">✓ {hl}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveHighlight(idx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: PRESENTACIONES CON PRECIOS INDIVIDUALES */}
                {activeTab === 'presentations' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50 p-4 rounded-2xl border border-amber-200">
                      <div>
                        <h3 className="text-xs font-bold text-amber-950 uppercase flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-amber-800" />
                          Configuración de Presentaciones y Precios Específicos
                        </h3>
                        <p className="text-[11px] text-amber-900 mt-0.5">
                          Configure cada presentación (ej. Litro, Galón, Caneca 5 Gal) con su precio individual. El cliente verá estos precios en el selector del catálogo y en el carrito.
                        </p>
                      </div>

                      {/* Presets */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Plantilla:</span>
                        <button
                          type="button"
                          onClick={() => handleApplyPresetPresentations('paint')}
                          className="px-2.5 py-1 text-[11px] font-bold bg-white border border-amber-300 rounded-lg text-slate-800 hover:bg-amber-100 cursor-pointer"
                        >
                          Pinturas (Lt/Gal/Can)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPresetPresentations('electric')}
                          className="px-2.5 py-1 text-[11px] font-bold bg-white border border-amber-300 rounded-lg text-slate-800 hover:bg-amber-100 cursor-pointer"
                        >
                          Cables (Rollo/Bobina)
                        </button>
                      </div>
                    </div>

                    {/* Presentations Table / List */}
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700">
                            <th className="py-2.5 px-3">Nombre de Presentación *</th>
                            <th className="py-2.5 px-3">Precio USD *</th>
                            <th className="py-2.5 px-3">Imagen Adjunta por Presentación (URL o Subir)</th>
                            <th className="py-2.5 px-3">Detalle / Rendimiento</th>
                            <th className="py-2.5 px-2 text-center w-12">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {presentationsList.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                                No hay presentaciones configuradas. Haga clic en "+ Añadir Presentación" o use una plantilla.
                              </td>
                            </tr>
                          ) : (
                            presentationsList.map((pres, index) => (
                              <tr key={index} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 w-40">
                                  <input
                                    type="text"
                                    required
                                    value={pres.name}
                                    onChange={(e) =>
                                      handleUpdatePresentationRow(index, 'name', e.target.value)
                                    }
                                    placeholder="Ej. Galón"
                                    className="w-full px-2.5 py-1 text-xs font-bold bg-slate-50 border border-slate-300 rounded-md text-slate-900"
                                  />
                                </td>
                                <td className="py-2.5 px-3 w-28">
                                  <div className="relative">
                                    <span className="absolute left-2.5 top-1 font-bold text-slate-400 text-xs">
                                      $
                                    </span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min={0.01}
                                      required
                                      value={pres.unitPrice}
                                      onChange={(e) =>
                                        handleUpdatePresentationRow(
                                          index,
                                          'unitPrice',
                                          Number(e.target.value)
                                        )
                                      }
                                      className="w-full pl-6 pr-2 py-1 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-md text-slate-900 text-right"
                                    />
                                  </div>
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-2">
                                    {pres.imageUrl ? (
                                      <img
                                        src={pres.imageUrl}
                                        alt={pres.name}
                                        className="w-9 h-9 rounded-lg object-cover border border-slate-300 shrink-0 bg-white"
                                      />
                                    ) : (
                                      <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                                        <ImageIcon className="w-4 h-4" />
                                      </div>
                                    )}
                                    <input
                                      type="url"
                                      data-testid={`presentation-image-url-${index}`}
                                      value={pres.imageUrl || ''}
                                      onChange={(e) =>
                                        handleUpdatePresentationRow(
                                          index,
                                          'imageUrl',
                                          e.target.value
                                        )
                                      }
                                      placeholder="URL imagen de esta presentación..."
                                      className="flex-1 px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-800"
                                    />
                                    <label
                                      className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-[#0B2861] border border-blue-200 rounded-md text-[11px] font-bold cursor-pointer shrink-0 flex items-center gap-1"
                                      title="Subir archivo de imagen para esta presentación"
                                    >
                                      <Upload className="w-3 h-3" />
                                      <span>Subir</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handlePresentationImageUpload(index, e)}
                                        className="hidden"
                                      />
                                    </label>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 w-44">
                                  <input
                                    type="text"
                                    value={pres.description || ''}
                                    onChange={(e) =>
                                      handleUpdatePresentationRow(
                                        index,
                                        'description',
                                        e.target.value
                                      )
                                    }
                                    placeholder="Rinde 25 a 30 m²"
                                    className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-600"
                                  />
                                </td>
                                <td className="py-2.5 px-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePresentationRow(index)}
                                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                    title="Eliminar presentación"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <button
                        type="button"
                        onClick={handleAddPresentationRow}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-[#0B2861]" />
                        <span>+ Añadir Fila de Presentación</span>
                      </button>

                      <div className="text-right text-xs text-slate-500">
                        Total presentaciones configuradas: <strong className="text-slate-900">{presentationsList.length}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>

                <div className="flex items-center gap-2">
                  {activeTab !== 'presentations' ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeTab === 'general') setActiveTab('media');
                        else if (activeTab === 'media') setActiveTab('technical');
                        else if (activeTab === 'technical') setActiveTab('presentations');
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold cursor-pointer"
                    >
                      Siguiente Paso →
                    </button>
                  ) : null}

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0B2861] hover:bg-blue-900 text-white text-xs font-black shadow-md cursor-pointer transition-all"
                  >
                    <Check className="w-4 h-4 text-[#FFD100]" />
                    <span>{editingItem ? 'Guardar Cambios del Producto' : 'Dar de Alta Producto'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {catalogPdfPreviewHtml && (
        <ExecutiveDocumentPreviewModal
          isOpen={true}
          onClose={() => setCatalogPdfPreviewHtml(null)}
          title="Catálogo Corporativo Minimalista — Industrial Latina & Induless"
          documentHtml={catalogPdfPreviewHtml}
          filename={`Catalogo_Minimalista_Industrial_Latina_${new Date().toISOString().slice(0, 10)}.html`}
        />
      )}
    </div>
  );
};
