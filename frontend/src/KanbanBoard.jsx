import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { MoreHorizontal, Calendar, Briefcase, Ghost } from 'lucide-react';
import axios from 'axios';
import { remoteLog } from './utils/logger';

const columns = {
    draft: { title: 'DRAFTS' },
    sent: { title: 'APPLIED' },
    interview: { title: 'INTERVIEW' },
    offer: { title: 'OFFER' },
    rejected: { title: 'REJECTED' }
};

const KanbanBoard = ({ apps, onUpdate }) => {
    const boardData = {
        draft: apps.filter(a => a.status === 'draft' || !a.status),
        sent: apps.filter(a => a.status === 'sent'),
        interview: apps.filter(a => a.status === 'interview'),
        offer: apps.filter(a => a.status === 'offer'),
        rejected: apps.filter(a => a.status === 'rejected')
    };

    const onDragEnd = async (result) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        try {
            const newStatus = destination.droppableId;
            remoteLog(`Moving application ${draggableId} to ${newStatus}`);
            await axios.patch(`/api/applications/${draggableId}/`, { status: newStatus });
            onUpdate();
        } catch (err) {
            alert("Failed to move card: " + err.message);
        }
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex overflow-x-auto h-[calc(100vh-6rem)] border-t border-[#232838]">
                {Object.entries(columns).map(([colId, colDef]) => (
                    <div key={colId} className="w-[300px] shrink-0 border-r border-[#232838] bg-[#0E1015]/50 flex flex-col relative group/col">
                        <div className="flex items-center justify-between p-3 border-b border-[#232838]/50 bg-[#0E1015] z-10 sticky top-0">
                            <h3 className="text-[11px] font-bold text-[#9BA1AE] tracking-widest flex items-center gap-2">
                                {colDef.title}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${boardData[colId]?.length ? 'bg-[#5E6AD2]/10 text-[#5E6AD2]' : 'bg-[#232838] text-[#6B7280]'}`}>
                                    {boardData[colId]?.length || 0}
                                </span>
                            </h3>
                            <button className="text-[#6B7280] hover:text-[#E6E8EB] opacity-0 group-hover/col:opacity-100 transition-opacity"><MoreHorizontal size={14} /></button>
                        </div>

                        <Droppable droppableId={colId}>
                            {(provided, snapshot) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={`flex-1 p-3 transition-colors relative ${snapshot.isDraggingOver ? 'bg-[#151821]/50' : ''}`}
                                >
                                    {boardData[colId]?.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center opacity-40 hover:opacity-100 transition-opacity select-none min-h-[150px]">
                                            <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#232838] flex items-center justify-center mb-3">
                                                <div className="w-2 h-2 rounded-full bg-[#232838]" />
                                            </div>
                                            <p className="text-[10px] font-medium text-[#6B7280] uppercase tracking-widest">No Items</p>
                                        </div>
                                    )}

                                    {boardData[colId]?.map((app, index) => (
                                        <Draggable key={app.tracking_id} draggableId={String(app.tracking_id)} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className={`mb-2 p-3 rounded-lg border shadow-sm group transition-all duration-200
                                                        ${snapshot.isDragging
                                                            ? 'bg-[#1B1F2A] border-[#5E6AD2] shadow-xl rotate-2 z-50 scale-105'
                                                            : 'bg-[#151821] border-[#232838] hover:border-[#3F4555] hover:bg-[#1A1D26]'
                                                        }
                                                    `}
                                                    style={provided.draggableProps.style}
                                                >
                                                    <h4 className="font-medium text-[#E6E8EB] text-sm mb-1 leading-tight">{app.job?.title || 'Unknown Job'}</h4>
                                                    <p className="text-[11px] text-[#9BA1AE] mb-3 truncate flex items-center gap-1">
                                                        <Briefcase size={10} />
                                                        {app.job?.company}
                                                    </p>

                                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#232838]/50">
                                                        <div className="text-[10px] text-[#6B7280] flex items-center gap-1.5 font-medium">
                                                            <Calendar size={10} /> {new Date(app.sent_at || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                        </div>
                                                        <div className="w-5 h-5 rounded-full bg-[#232838] text-[8px] flex items-center justify-center text-[#9BA1AE] font-bold border border-[#3F4555] shadow-inner">
                                                            ME
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </div>
                ))}
            </div>
        </DragDropContext>
    );
};

export default KanbanBoard;
