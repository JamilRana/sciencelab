"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Receipt, Calendar, CreditCard } from "lucide-react";
import { DataModal } from "@/components/ui/data-modal";
import { DataTable, Column } from "@/components/ui/data-table";
import { ExpenseForm } from "@/components/forms/ExpenseForm";
import { createExpenseAction, updateExpenseAction, deleteExpenseAction } from "@/app/actions/expenses";
import { toast } from "sonner";
import type { Expense } from "@/types";

interface ExpenseListProps {
  initialExpenses: Expense[];
}

export function ExpenseList({ initialExpenses }: ExpenseListProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const columns: Column<Expense>[] = [
    {
      key: "description",
      header: "Description",
      sortable: true,
      render: (expense) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <Receipt className="h-5 w-5" />
          </div>
          <p className="font-semibold text-gray-900">{expense.description}</p>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      render: (expense) => (
        <span className="font-bold text-red-600">৳{expense.amount.toLocaleString()}</span>
      ),
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      render: (expense) => (
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          {new Date(expense.date).toLocaleDateString()}
        </div>
      ),
    },
  ];

  const totalExpenses = initialExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleOpenCreate = () => {
    setEditingExpense(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setEditingExpense(null);
    setIsModalOpen(false);
  };

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const result = editingExpense
        ? await updateExpenseAction(editingExpense.id, data)
        : await createExpenseAction(data);

      if (result.success) {
        toast.success(editingExpense ? "Expense updated" : "Expense added");
        handleClose();
        router.refresh();
      } else {
        toast.error(result.error || "Operation failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      const result = await deleteExpenseAction(id);
      if (result.success) {
        toast.success("Expense deleted");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-2xl shadow-lg">
        <div>
          <p className="text-red-100 text-sm font-medium">Total Expenses</p>
          <p className="text-white text-3xl font-bold">৳{totalExpenses.toLocaleString()}</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 h-11 bg-white text-red-600 font-bold rounded-xl shadow-lg transition-all active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Add Expense
        </button>
      </div>

      <DataTable
        data={initialExpenses}
        columns={columns}
        searchFields={["description"]}
        placeholder="Search expenses..."
        pageSize={15}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        emptyMessage="No expenses found"
      />

      <DataModal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingExpense ? "Edit Expense" : "Add Expense"}
      >
        <ExpenseForm
          initialData={editingExpense}
          onSubmit={onSubmit}
          isLoading={isLoading}
        />
      </DataModal>
    </div>
  );
}
