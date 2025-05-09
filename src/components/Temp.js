import React, { useState, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Box, Card, Button, Typography } from "@mui/material";

const sampleScreen2 = [
  { id: "1", name: "Process 1" },
  { id: "2", name: "Process 2" },
  { id: "3", name: "Process 3" },
];

export default function DragAndDrop() {
  const [data, setData] = useState(sampleScreen2);

  // Memoized version of data to prevent unnecessary re-renders
  const memoizedData = useMemo(() => data, [data]);

  // Handle drag event
  const handleOnDragEnd = (result) => {
    if (!result.destination) return;

    const reorderedData = Array.from(data);
    const [movedItem] = reorderedData.splice(result.source.index, 1);
    reorderedData.splice(result.destination.index, 0, movedItem);

    setData(reorderedData);
  };

  return (
    <Box sx={{ p: 4, maxWidth: 400, mx: "auto" }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Drag and Drop Steps
      </Typography>

      <DragDropContext onDragEnd={handleOnDragEnd}>
        <Droppable droppableId="droppable-steps">
          {(provided) => (
            <Box
              ref={provided.innerRef}
              {...provided.droppableProps}
              sx={{
                minHeight: 200,
                bgcolor: "#e0e0e0",
                p: 2,
                borderRadius: 2,
              }}
            >
              {memoizedData.map((item, index) => (
                <Draggable
                  key={String(item.id)} // Ensure ID is a string
                  draggableId={String(item.id)} // Ensure ID is a string
                  index={index}
                >
                  {(provided) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      sx={{ p: 2, mb: 2, bgcolor: "#f5f5f5", color: "black" }}
                    >
                      {item.name}
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </DragDropContext>
    </Box>
  );
}
