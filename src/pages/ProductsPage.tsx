import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Eye,
  Edit3,
  Copy,
  Trash2,
  FileSpreadsheet,
  Layers,
  X,
  CheckCircle2,
  AlertCircle,
  Tag,
  Boxes,
} from 'lucide-react';
import { storage } from '../services/storage';
import { Product, UnitType } from '../types';
import { useToast } from '../context/ToastContext';
import { formatINR } from '../utils/calculator';

export const ProductsPage: React.FC = () => {
  const { success, error } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMaterial, setSelectedMaterial] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Detail View Drawer
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  // Form State
  const [productCode, setProductCode] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [material, setMaterial] = useState('Stainless Steel');
  const [grade, setGrade] = useState('');
  const [size, setSize] = useState('');
  const [od, setOd] = useState('');
  const [idDim, setIdDim] = useState('');
  const [thickness, setThickness] = useState('');
  const [length, setLength] = useState('6 MTR');
  const [width, setWidth] = useState('');
  const [schedule, setSchedule] = useState('');
  const [classRating, setClassRating] = useState('');
  const [pressureRating, setPressureRating] = useState('');
  const [standard, setStandard] = useState('ASTM A312');
  const [specification, setSpecification] = useState('Solution Annealed & Pickled');
  const [finish, setFinish] = useState('Mill Finish / Pickled');
  const [form, setForm] = useState('Seamless');
  const [unit, setUnit] = useState<UnitType>('MTR');
  const [hsnCode, setHsnCode] = useState('73044100');
  const [gstRate, setGstRate] = useState<number>(18);
  const [defaultSellingPrice, setDefaultSellingPrice] = useState<number>(1450);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const products = useMemo(() => storage.getProducts(), [refreshKey]);
  const categories = useMemo(() => storage.getCategories(), [refreshKey]);

  // Unique Materials & Categories
  const uniqueMaterials = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.material)));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.productCode.toLowerCase().includes(search.toLowerCase()) ||
        p.grade.toLowerCase().includes(search.toLowerCase()) ||
        p.material.toLowerCase().includes(search.toLowerCase()) ||
        (p.size && p.size.toLowerCase().includes(search.toLowerCase()));

      const matchCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const matchMaterial = selectedMaterial === 'all' || p.material === selectedMaterial;
      const matchStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'active' && p.isActive) ||
        (selectedStatus === 'inactive' && !p.isActive);

      return matchSearch && matchCategory && matchMaterial && matchStatus;
    });
  }, [products, search, selectedCategory, selectedMaterial, selectedStatus]);

  const openAddModal = () => {
    setEditingProduct(null);
    setProductCode(`JMA-SKU-${products.length + 101}`);
    setName('');
    setCategoryId(categories[0]?.id || '');
    setSubcategory('');
    setMaterial('Stainless Steel');
    setGrade('');
    setSize('');
    setOd('');
    setIdDim('');
    setThickness('');
    setLength('6 MTR');
    setWidth('');
    setSchedule('SCH 40');
    setClassRating('');
    setPressureRating('');
    setStandard('ASTM / ASME');
    setSpecification('Solution Annealed & Pickled');
    setFinish('Mill Finish');
    setForm('Seamless');
    setUnit('MTR');
    setHsnCode('73044100');
    setGstRate(18);
    setDefaultSellingPrice(1500);
    setDescription('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setProductCode(p.productCode);
    setName(p.name);
    setCategoryId(p.categoryId);
    setSubcategory(p.subcategory || '');
    setMaterial(p.material);
    setGrade(p.grade);
    setSize(p.size || '');
    setOd(p.od || '');
    setIdDim(p.idDim || '');
    setThickness(p.thickness || '');
    setLength(p.length || '');
    setWidth(p.width || '');
    setSchedule(p.schedule || '');
    setClassRating(p.classRating || '');
    setPressureRating(p.pressureRating || '');
    setStandard(p.standard || '');
    setSpecification(p.specification || '');
    setFinish(p.finish || '');
    setForm(p.form || '');
    setUnit(p.unit);
    setHsnCode(p.hsnCode);
    setGstRate(p.gstRate);
    setDefaultSellingPrice(p.defaultSellingPrice);
    setDescription(p.description);
    setIsActive(p.isActive);
    setIsModalOpen(true);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !grade.trim()) {
      error('Validation Error', 'Product Name and Grade are required');
      return;
    }

    const cat = categories.find((c) => c.id === categoryId) || categories[0];

    storage.saveProduct({
      ...(editingProduct ? { id: editingProduct.id } : {}),
      productCode,
      name,
      categoryId: cat.id,
      categoryName: cat.name,
      subcategory,
      material,
      grade,
      size,
      od,
      idDim,
      thickness,
      length,
      width,
      schedule,
      classRating,
      pressureRating,
      standard,
      specification,
      finish,
      form,
      unit,
      hsnCode,
      gstRate: Number(gstRate) || 18,
      defaultSellingPrice: Number(defaultSellingPrice) || 0,
      description,
      isActive,
    });

    success(
      editingProduct ? 'Product Updated' : 'Product Created',
      `${name} saved to catalog`
    );
    setIsModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  const handleDuplicate = (id: string) => {
    const dup = storage.duplicateProduct(id);
    if (dup) {
      success('Product Duplicated', `Created copy ${dup.name}`);
      setRefreshKey((k) => k + 1);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      storage.deleteProduct(id);
      success('Product Deleted', `Removed ${name}`);
      setRefreshKey((k) => k + 1);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Product Code',
      'Product Name',
      'Category',
      'Material',
      'Grade',
      'Size',
      'Schedule',
      'Thickness',
      'Standard',
      'Unit',
      'HSN Code',
      'GST Rate',
      'Rate (INR)',
      'Status',
    ];

    const rows = filteredProducts.map((p) => [
      p.productCode,
      `"${p.name.replace(/"/g, '""')}"`,
      p.categoryName,
      p.material,
      p.grade,
      p.size || '',
      p.schedule || '',
      p.thickness || '',
      p.standard || '',
      p.unit,
      p.hsnCode,
      p.gstRate,
      p.defaultSellingPrice,
      p.isActive ? 'Active' : 'Inactive',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Jubilant_Products_Catalog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('CSV Exported', 'Catalog spreadsheet exported successfully');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">
            Products & Alloys Database
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Industrial metal catalog with ASTM/ASME specifications, dimensions and rates.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 shadow-soft"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-md shadow-red-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Metal Product</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-soft grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search alloy, grade, size, SKU..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-red-500"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Material Filter */}
        <div>
          <select
            value={selectedMaterial}
            onChange={(e) => setSelectedMaterial(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">All Materials ({uniqueMaterials.length})</option>
            {uniqueMaterials.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active Products Only</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Material & Grade</th>
                <th className="py-3 px-4">Size / Dimensions</th>
                <th className="py-3 px-4 text-center">HSN</th>
                <th className="py-3 px-4 text-center">GST</th>
                <th className="py-3 px-4 text-right">Default Rate (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-3 px-4 font-mono font-bold text-red-600">
                    {p.productCode}
                  </td>
                  <td className="py-3 px-4">
                    <p
                      onClick={() => setViewingProduct(p)}
                      className="font-bold text-slate-900 hover:text-red-600 cursor-pointer"
                    >
                      {p.name}
                    </p>
                    <p className="text-[11px] text-slate-400 italic truncate max-w-xs">{p.specification}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-700">{p.categoryName}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-800">{p.grade}</span>
                    <span className="block text-[10px] text-slate-500">{p.material}</span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">
                    {p.size || p.schedule || p.thickness || '-'}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-500">
                    {p.hsnCode}
                  </td>
                  <td className="py-3 px-4 text-center font-medium text-slate-600">
                    {p.gstRate}%
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {formatINR(p.defaultSellingPrice)} <span className="text-[10px] text-slate-500 font-sans">/{p.unit}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        p.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setViewingProduct(p)}
                        title="View Specifications"
                        className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(p)}
                        title="Edit Product"
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(p.id)}
                        title="Duplicate Product"
                        className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        title="Delete Product"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
          Showing {filteredProducts.length} of {products.length} industrial products
        </div>
      </div>

      {/* Product Detail Specifications Drawer */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                  {viewingProduct.productCode}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{viewingProduct.name}</h3>
              </div>
              <button
                onClick={() => setViewingProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Material Family</span>
                  <p className="font-semibold text-slate-800">{viewingProduct.material}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Alloy Grade</span>
                  <p className="font-bold text-red-600 font-mono text-sm">{viewingProduct.grade}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Category</span>
                  <p className="font-semibold text-slate-800">{viewingProduct.categoryName}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Manufacturing Form</span>
                  <p className="font-semibold text-slate-800">{viewingProduct.form || 'Seamless'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Size</span>
                  <p className="font-semibold text-slate-900">{viewingProduct.size || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Schedule</span>
                  <p className="font-semibold text-slate-900">{viewingProduct.schedule || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Thickness</span>
                  <p className="font-semibold text-slate-900">{viewingProduct.thickness || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Standard</span>
                  <p className="font-semibold text-slate-900">{viewingProduct.standard || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Surface Finish</span>
                  <p className="font-semibold text-slate-900">{viewingProduct.finish || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">HSN / GST</span>
                  <p className="font-mono font-semibold text-slate-900">{viewingProduct.hsnCode} ({viewingProduct.gstRate}%)</p>
                </div>
              </div>

              {viewingProduct.description && (
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">Description</span>
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {viewingProduct.description}
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Default Selling Rate</span>
                  <p className="font-mono font-bold text-base text-slate-900">
                    {formatINR(viewingProduct.defaultSellingPrice)} / {viewingProduct.unit}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setViewingProduct(null);
                    openEditModal(viewingProduct);
                  }}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white font-semibold rounded-xl text-xs"
                >
                  Edit Specifications
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-red-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingProduct ? 'Edit Metal Product Specifications' : 'Add Metal Product to Catalog'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. SS 316L Seamless Pipe"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Product SKU / Code</label>
                  <input
                    type="text"
                    value={productCode}
                    onChange={(e) => setProductCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Material Family</label>
                  <input
                    type="text"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    placeholder="e.g. Stainless Steel / Inconel / Monel"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Alloy Grade <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="e.g. ASTM A312 TP316L"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Dimensions & Industrial Specs */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Dimensions & Technical Standards
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-medium text-slate-600 mb-0.5">Size / NB</label>
                    <input
                      type="text"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      placeholder='2" NB / 50mm'
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-0.5">Schedule / Class</label>
                    <input
                      type="text"
                      value={schedule}
                      onChange={(e) => setSchedule(e.target.value)}
                      placeholder="SCH 40 / Class 150"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-0.5">Thickness</label>
                    <input
                      type="text"
                      value={thickness}
                      onChange={(e) => setThickness(e.target.value)}
                      placeholder="3.91 mm"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-0.5">Form</label>
                    <input
                      type="text"
                      value={form}
                      onChange={(e) => setForm(e.target.value)}
                      placeholder="Seamless / Welded / Forged"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium text-slate-600 mb-0.5">Standard</label>
                    <input
                      type="text"
                      value={standard}
                      onChange={(e) => setStandard(e.target.value)}
                      placeholder="ASTM A312 / ASME SA312"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-0.5">Surface Finish</label>
                    <input
                      type="text"
                      value={finish}
                      onChange={(e) => setFinish(e.target.value)}
                      placeholder="No. 1 / 2B / Pickled"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-0.5">Specification / Treatment</label>
                    <input
                      type="text"
                      value={specification}
                      onChange={(e) => setSpecification(e.target.value)}
                      placeholder="Solution Annealed & NDT Tested"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Commercial Pricing & Statutory Rates */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Billing Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as UnitType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                  >
                    <option value="MTR">MTR</option>
                    <option value="KG">KG</option>
                    <option value="PCS">PCS</option>
                    <option value="MT">MT</option>
                    <option value="SET">SET</option>
                    <option value="NOS">NOS</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Default Selling Price (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={defaultSellingPrice}
                    onChange={(e) => setDefaultSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    placeholder="73044100"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GST Rate %</label>
                  <select
                    value={gstRate}
                    onChange={(e) => setGstRate(parseFloat(e.target.value) || 18)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                  >
                    <option value="18">18% (Standard Metal)</option>
                    <option value="12">12%</option>
                    <option value="28">28%</option>
                    <option value="5">5%</option>
                    <option value="0">0%</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Description / Notes</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Application details, certifications, heat treatment..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <label htmlFor="isActiveToggle" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Active in Catalog (Available for Quotations)
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md shadow-red-600/20"
                >
                  {editingProduct ? 'Update Product' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
