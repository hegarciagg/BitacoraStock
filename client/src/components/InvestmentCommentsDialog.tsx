
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/useToast";
import { Loader2, Send, Pencil, Trash2, X } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface InvestmentCommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investmentId: number;
  investmentSymbol: string;
}

export function InvestmentCommentsDialog({
  open,
  onOpenChange,
  investmentId,
  investmentSymbol,
}: InvestmentCommentsDialogProps) {
  const { success, error } = useToast();
  const [newComment, setNewComment] = useState("");
  const [commentDate, setCommentDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);

  const ctx = trpc.useContext();
  const commentsQuery = trpc.investment.getComments.useQuery(
    { investmentId },
    { enabled: open }
  );

  const addCommentMutation = trpc.investment.addComment.useMutation({
    onSuccess: () => {
      success("Comentario agregado", "El comentario se ha guardado correctamente.");
      setNewComment("");
      setCommentDate(new Date().toISOString().split("T")[0]);
      ctx.investment.getComments.invalidate({ investmentId });
      setIsSubmitting(false);
    },
    onError: (err) => {
      error("Error", err.message || "No se pudo agregar el comentario.");
      setIsSubmitting(false);
    },
  });

  const updateCommentMutation = trpc.investment.updateComment.useMutation({
    onSuccess: () => {
      success("Comentario actualizado", "Los cambios se han guardado correctamente.");
      setNewComment("");
      setEditingCommentId(null);
      setCommentDate(new Date().toISOString().split("T")[0]);
      ctx.investment.getComments.invalidate({ investmentId });
      setIsSubmitting(false);
    },
    onError: (err) => {
      error("Error", err.message || "No se pudo actualizar el comentario.");
      setIsSubmitting(false);
    },
  });

  const deleteCommentMutation = trpc.investment.deleteComment.useMutation({
    onSuccess: () => {
      success("Comentario eliminado", "El comentario ha sido eliminado.");
      ctx.investment.getComments.invalidate({ investmentId });
    },
    onError: (err) => {
      error("Error", err.message || "No se pudo eliminar el comentario.");
    },
  });

  const handleEdit = (comment: any) => {
    setEditingCommentId(comment.id);
    setNewComment(comment.comment);
    setCommentDate(new Date(comment.date).toISOString().split("T")[0]);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setNewComment("");
    setCommentDate(new Date().toISOString().split("T")[0]);
  };

  const handleDelete = (commentId: number) => {
    if (confirm("¿Estás seguro de eliminar este comentario?")) {
      deleteCommentMutation.mutate({ commentId });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (editingCommentId) {
      updateCommentMutation.mutate({
        commentId: editingCommentId,
        comment: newComment,
        date: new Date(commentDate),
        sentiment: "neutral",
      });
    } else {
      addCommentMutation.mutate({
        investmentId,
        comment: newComment,
        date: new Date(commentDate),
        sentiment: "neutral", 
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col bg-slate-900 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Bitácora de Mercado: <span className="text-blue-400">{investmentSymbol}</span>
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Historial de comentarios y análisis para esta inversión.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col gap-4">
          <ScrollArea className="flex-1 pr-4 border rounded-md border-slate-700 bg-slate-950/50 p-4">
            {commentsQuery.isLoading ? (
              <div className="flex justify-center items-center h-20">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : commentsQuery.data?.length === 0 ? (
              <div className="text-center text-slate-500 py-10">
                No hay comentarios registrados. Comienza escribiendo uno abajo.
              </div>
            ) : (
              <div className="space-y-4">
                {commentsQuery.data?.map((comment) => (
                  <div key={comment.id} className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-medium text-slate-400 bg-slate-900/50 px-2 py-1 rounded">
                        {format(new Date(comment.date), "PPP", { locale: es })}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:bg-slate-700 text-slate-400 hover:text-blue-400"
                          onClick={() => handleEdit(comment)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:bg-slate-700 text-slate-400 hover:text-red-400"
                          onClick={() => handleDelete(comment.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-200 whitespace-pre-wrap">{comment.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <form onSubmit={handleSubmit} className="border-t border-slate-700 pt-4 space-y-4">
            <div className="space-y-2">
               <div className="flex items-center justify-between">
                <Label htmlFor="new-comment" className="text-slate-200">
                  {editingCommentId ? "Editar Comentario" : "Nuevo Comentario"}
                </Label>
                <div className="w-40">
                    <Input
                        type="date"
                        value={commentDate}
                        onChange={(e) => setCommentDate(e.target.value)}
                        className="h-8 text-xs bg-slate-800 border-slate-700 text-slate-300"
                    />
                </div>
               </div>
              <Textarea
                id="new-comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe tu análisis o motivo..."
                className="min-h-[100px] bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500"
              />
            </div>
            <div className="flex justify-end bg-slate-900 border-t border-slate-800 pt-4 mt-4">
              {editingCommentId && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  className="mr-2 hover:bg-slate-800 text-slate-400"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              )}
              <Button 
                type="submit" 
                disabled={!newComment.trim() || isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {editingCommentId ? "Actualizar" : "Guardar Comentario"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
