"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Image,
  Text,
  Button,
  NumberInput,
  Group,
  Stack,
  Badge,
  Checkbox,
  TextInput,
  ActionIcon,
  Modal,
  Grid,
  GridCol,
} from "@mantine/core";
import {
  IconHeartPlus,
  IconHeart,
  IconHeartFilled,
  IconSend,
  IconMaximize,
  IconLink,
  IconX,
} from "@tabler/icons-react";
import { useImage, useSelection } from "./ContextCamera";

export function ImageAnnotation({ fetchNextImage }) {
  const [currentImage, setCurrentImage] = useImage();
  const [selection, setSelection] = useSelection();
  const [animalCounts, setAnimalCounts] = useState({});
  const [noAnimalsVisible, setNoAnimalsVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState(false);
  const [humanPresent, setHumanPresent] = useState(false);
  const [vehiclePresent, setVehiclePresent] = useState(false);

  useEffect(() => {
    if (currentImage) {
      setComments(currentImage.mediaComments || []);
      setIsFavorite(currentImage.favorite || false);
    }
  }, [currentImage]);

  const handleCountChange = (id, value) => {
    setAnimalCounts((prev) => ({ ...prev, [id]: value }));
  };

  const handleNoAnimalsClick = () => {
    setNoAnimalsVisible(true);
    setSelection([]);
    setAnimalCounts({});
    handleSaveObservations();
  };

  const handleSaveObservations = async () => {
    if (!currentImage) return;

    setIsSaving(true);
    if (comment.trim()) {
      await handleAddComment();
    }

    let observations = [];

    if (noAnimalsVisible && !humanPresent && !vehiclePresent) {
      observations = [
        {
          mediaId: currentImage.mediaID,
          mediaInfo: {
            md5: currentImage.mediaID,
            imageHash: currentImage.imageHash,
          },
          eventStart: currentImage.timestamp,
          eventEnd: currentImage.timestamp,
          observationLevel: "media",
          observationType: "blank",
        },
      ];
    } else {
      if (selection.length > 0) {
        observations = selection.map((animal) => ({
          mediaId: currentImage.mediaID,
          mediaInfo: {
            md5: currentImage.mediaID,
            imageHash: currentImage.imageHash,
          },
          taxonId: animal.id,
          scientificName: animal.name,
          count: animalCounts[animal.id] || 1,
          eventStart: currentImage.timestamp,
          eventEnd: currentImage.timestamp,
          observationLevel: "media",
          observationType: "animal",
        }));
      }

      if (humanPresent) {
        observations.push({
          mediaId: currentImage.mediaID,
          mediaInfo: {
            md5: currentImage.mediaID,
            imageHash: currentImage.imageHash,
          },
          eventStart: currentImage.timestamp,
          eventEnd: currentImage.timestamp,
          observationLevel: "media",
          observationType: "human",
        });
      }

      if (vehiclePresent) {
        observations.push({
          mediaId: currentImage.mediaID,
          mediaInfo: {
            md5: currentImage.mediaID,
            imageHash: currentImage.imageHash,
          },
          eventStart: currentImage.timestamp,
          eventEnd: currentImage.timestamp,
          observationLevel: "media",
          observationType: "vehicle",
        });
      }
    }

    try {
      const response = await fetch("/api/cameratrap/saveObservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(observations),
      });

      if (response.ok) {
        // Instead of fetchRandomImage, use fetchNextImage

        await fetchNextImage();
        setSelection([]);
        setAnimalCounts({});
        setNoAnimalsVisible(false);
      } else {
        alert("Failed to save observations");
      }
    } catch (error) {
      console.error("Error saving observations:", error);
      alert("Error saving observations");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;

    try {
      const response = await fetch("/api/cameratrap/addComment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId: currentImage.mediaID, comment }),
      });

      if (response.ok) {
        const newComment = await response.json();
        setComments([...comments, newComment]);
        setComment("");
      } else {
        alert("Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Error adding comment");
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const response = await fetch("/api/cameratrap/toggleFavorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId: currentImage.mediaID }),
      });

      if (response.ok) {
        setIsFavorite(!isFavorite);
      } else {
        alert("Failed to toggle favorite");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      alert("Error toggling favorite");
    }
  };

  const toggleEnlargedImage = () => {
    setEnlargedImage(!enlargedImage);
  };

  const handleRemoveAnimal = (animalId) => {
    setSelection((prev) => prev.filter((animal) => animal.id !== animalId));
    setAnimalCounts((prev) => {
      const newCounts = { ...prev };
      delete newCounts[animalId];
      return newCounts;
    });
  };

  if (!currentImage) {
    return <Text>No image selected</Text>;
  }
  console.log(currentImage);
  return (
    <Card
      shadow="sm" padding="lg" radius="md" withBorder 
      style={{ maxHeight: "90vh", overflow: "auto" }} // Should limit card height and allow scrolling
    >
      <Card.Section>
        <div style={{ position: "relative", height: "100%", overflow: "hidden" }}>
          <Image
            src={currentImage.publicURL}
            fit="contain"
            // height={700}
            width="100%"
            alt="Wildlife image"
            style= {{maxHeight: "400px" }} // Should control max height so image doesn't blow up
          />
          <ActionIcon
            style={{ position: "absolute", top: 10, right: 10 }}
            onClick={toggleEnlargedImage}
          >
            <IconMaximize size={24} />
          </ActionIcon>
        </div>
      </Card.Section>

      <Grid>
        <Group>
          <Text mt="md" style={{ fontFamily: "monospace" }}>
            Image Timestamp:{" "}
            {new Date(currentImage.timestamp).toLocaleString("en-US", {
              timeZone: "UTC",
            })}
          </Text>
          <Text mt="md" style={{ fontFamily: "monospace" }}>
            Media ID: {currentImage.mediaID}
          </Text>
        </Group>
        <GridCol span={6}>
          {!noAnimalsVisible && (
            <Stack spacing="xs" mt="md">
              {selection.map((animal) => (
                <Group key={animal.id} position="apart" noWrap>
                  <Text style={{ fontWeight: "bold", flex: 1 }}>
                    {animal.preferred_common_name || animal.name}
                  </Text>
                  <Group spacing="xs" noWrap>
                    <NumberInput
                      value={animalCounts[animal.id] || 1}
                      onChange={(value) => handleCountChange(animal.id, value)}
                      min={1}
                      max={100}
                      style={{ width: 80 }}
                    />
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      onClick={() => handleRemoveAnimal(animal.id)}
                    >
                      <IconX size={16} />
                    </ActionIcon>
                  </Group>
                </Group>
              ))}
            </Stack>
          )}
        </GridCol>
        <GridCol span={6}>
          <Group position="apart" mt="md">
            <ActionIcon
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(currentImage.publicURL);
                alert("Image URL copied to clipboard");
              }}
            >
              <IconLink />
            </ActionIcon>
            <ActionIcon
              onClick={handleToggleFavorite}
              color={isFavorite ? "red" : "red"}
              variant={isFavorite ? "filled" : "outline"}
            >
              {isFavorite ? (
                <IconHeart size={24} />
              ) : (
                <IconHeartPlus size={24} />
              )}
            </ActionIcon>
            <Text size="sm">Favorites: {currentImage.favoriteCount || 0}</Text>

            <TextInput
              placeholder="Add a comment..."
              value={comment}
              onChange={(event) => setComment(event.currentTarget.value)}
              style={{ flex: 1 }}
            />
            <ActionIcon onClick={handleAddComment} disabled={!comment.trim()}>
              <IconSend size={24} />
            </ActionIcon>
          </Group>
          <Stack spacing="xs" mt="md">
            {comments.map((comment, index) => (
              <Text key={index} size="sm">
                <strong>{comment.author.name}:</strong> {comment.text}
              </Text>
            ))}
          </Stack>
        </GridCol>

        <Group mt="md">
          <Checkbox
            label="Human Present"
            checked={humanPresent}
            onChange={(event) => setHumanPresent(event.currentTarget.checked)}
          />
          <Checkbox
            label="Vehicle Present"
            checked={vehiclePresent}
            onChange={(event) => setVehiclePresent(event.currentTarget.checked)}
          />
        </Group>

        {noAnimalsVisible ||
        selection.length > 0 ||
        humanPresent ||
        vehiclePresent ? (
          <Button
            color="blue"
            fullWidth
            mt="md"
            radius="md"
            onClick={handleSaveObservations}
            loading={isSaving}
          >
            {isSaving ? "Saving..." : "Save Observations"}
          </Button>
        ) : (
          <Button
            color="blue"
            variant="outline"
            fullWidth
            mt="md"
            radius="md"
            onClick={handleNoAnimalsClick}
            loading={isSaving}
          >
            No Animals Visible
          </Button>
        )}

        {selection.length === 0 &&
          !noAnimalsVisible &&
          !humanPresent &&
          !vehiclePresent && (
            <Text color="dimmed" align="center" mt="md">
              Select animals from the search results to add observations, mark
              as "No Animals Visible", or indicate human/vehicle presence
            </Text>
          )}

        <Modal
          opened={enlargedImage}
          onClose={() => setEnlargedImage(false)}
          size="100%"
          padding={0}
          styles={{
            inner: { padding: 0 },
            modal: { maxWidth: "100%" },
          }}
        >
          <div
            style={{
              width: "100vw",
              height: "100vh",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "black",
            }}
          >
            <Image
              src={currentImage.publicURL}
              fit="contain"
              // height="100vh"
              width="90%"
              alt="Enlarged wildlife image"
            />
          </div>
        </Modal>
      </Grid>
    </Card>
  );
}
