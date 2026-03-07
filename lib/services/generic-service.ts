import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type ServiceResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export class GenericService<T> {
  private model: any;
  private path: string;

  constructor(modelName: string, revalidatePathStr: string) {
    this.model = (prisma as any)[modelName];
    this.path = revalidatePathStr;
  }

  async getAll(params: any = {}): Promise<ServiceResult<T[]>> {
    try {
      const data = await this.model.findMany(params);
      return { success: true, data };
    } catch (error) {
      console.error(`Error in getAll:`, error);
      return { success: false, error: "Failed to fetch data" };
    }
  }

  async getById(id: number, params: any = {}): Promise<ServiceResult<T>> {
    try {
      const data = await this.model.findUnique({
        where: { id },
        ...params,
      });
      if (!data) return { success: false, error: "Record not found" };
      return { success: true, data };
    } catch (error) {
      console.error(`Error in getById:`, error);
      return { success: false, error: "Failed to fetch record" };
    }
  }

  async create(data: any): Promise<ServiceResult<T>> {
    try {
      const result = await this.model.create({ data });
      revalidatePath(this.path);
      return { success: true, data: result };
    } catch (error) {
      console.error(`Error in create:`, error);
      return { success: false, error: "Failed to create record" };
    }
  }

  async update(id: number, data: any): Promise<ServiceResult<T>> {
    try {
      const result = await this.model.update({
        where: { id },
        data,
      });
      revalidatePath(this.path);
      return { success: true, data: result };
    } catch (error) {
      console.error(`Error in update:`, error);
      return { success: false, error: "Failed to update record" };
    }
  }

  async delete(id: number): Promise<ServiceResult<T>> {
    try {
      const result = await this.model.delete({
        where: { id },
      });
      revalidatePath(this.path);
      return { success: true, data: result };
    } catch (error) {
      console.error(`Error in delete:`, error);
      return { success: false, error: "Failed to delete record" };
    }
  }
}

// Concrete service instances
export const StudentService = new GenericService<any>("student", "/admin-route/students");
export const BatchService = new GenericService<any>("batch", "/admin-route/batches");
export const SchoolService = new GenericService<any>("school", "/admin-route/schools");
