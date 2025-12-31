
DO $$
DECLARE
    target_ids UUID[] := ARRAY[
        'c9712992-f893-4ae2-a65c-34b02e9afbac',
        'dacf2f37-6f18-49ff-be63-cec78115ceef',
        '03982aa1-155d-4733-b1d3-2fd729dded4c',
        '288e8f65-1e84-4fbd-8d9e-b3e8cbdb2778',
        '9e0c4614-53cf-40d3-abdd-a1d0183c3909',
        '51100d41-a543-4109-ab62-9f18492961e0',
        '3e28e10f-4534-480a-ad68-1f5daa26be51',
        '50d054b8-e960-4ec5-8447-a6f6a57f8098',
        'f03f7158-57fb-409e-8b45-436fb30b2d8b',
        'cbcf610f-2093-483e-95c2-14cd2d19a808',
        '302bba8c-5ada-4a51-93f7-88bc313356f9',
        'f0824025-0d5b-4169-bb0a-eb9b26def5a3',
        'bbac666f-4ad4-4a6e-89a6-a53f62e71d60',
        'ee877be9-846b-4337-b7f1-37cea574eb99',
        'b3580f32-c7f3-4481-8bbe-2e31c5ebcdd7',
        '23fdb9ad-4dae-4082-a58d-d50b6ca737e3',
        '71800ce9-487e-4e67-8861-e0058ae5aefc',
        'c0505d8a-c32c-4d39-b29e-e75e8eceb851',
        '93e42a38-41ed-42c0-a45d-7dc1b4dcb76f',
        '4674b07f-5b83-4f67-b97d-88bee0bc2005',
        'd943507a-4b3e-42b6-8570-87c70c99125e',
        '8b0b9c53-5a1d-457a-a048-daafca7fbec0',
        '7b2c8a83-aa76-4238-9000-1b00979bc41e',
        'a27e5201-a970-47ea-8121-1ded602dd43f',
        'df63a67f-7758-43d3-9348-439c72c6956a',
        '036b4cc0-6ced-4c34-9c21-30f7db663fa0',
        'adc97e96-7192-4eb0-bb20-570e7451e8a2',
        '8770c495-a8eb-44b3-9d8d-944d7bfdae3d',
        '762f6622-6b90-431e-aaba-cfca06ed81cd',
        '0f929a0f-bd67-4ea0-a75b-8b9d90e57a2d',
        '8a1bec5d-b4eb-4c90-b341-866c5ad0b928',
        'dd21c25d-e5a2-4bcd-a68e-a94a08cea368',
        'f35809d1-ed5b-4556-b98a-a2dc53f6195d',
        '2ccebb49-1cdf-40b4-9513-9f52765724d6',
        '7a8e94b4-702b-4007-bf00-9a692aea81e2',
        '5278905d-c890-4690-ab32-676e598363a7',
        '0b03a977-cdb2-4944-ae9e-a82b03e0589c',
        '5dadc74b-a7aa-4a69-ac5e-2c103bb6ebd6',
        'a9a60cb2-6720-4ada-86f9-222c782413b7',
        '62ab8468-a875-4fc7-ab92-de5d812aec7b',
        '40aa1543-75b2-4d93-a203-35d30650074d',
        'a9abceb5-8a78-4325-8f3e-1a45224e7620',
        '3c0b9c15-c028-45da-8772-a4ee5c7dfe4a',
        '819fa1e0-5749-4f91-984f-399f41cdea1e',
        'b5f19840-fa64-4840-b3ca-db4992556fe7',
        '0d2d3578-acf5-4d9b-ae1f-32410c8a6daf',
        '61b1ec15-19bb-441e-ac8a-26a74618a348',
        '11952d7e-d719-4b49-9b1b-3d4f9f93683d',
        '157b93d6-a79f-44a6-ae58-4e381cd78d35',
        '6d57417c-4115-4892-b8ef-d489c3291be9',
        '4f3ec80f-36df-4223-b49d-f5055fadc310',
        '102077a5-228c-4c79-bcde-822948ac2e6d',
        '45be0d35-dcd3-4ed7-a65d-1f8a9f0544d8',
        'a7e23b17-29a7-4b05-9554-83f8dc88ec2d',
        'dc3c5b7f-6f29-4542-ac78-0160c8c4e89b',
        '4d6798ae-fd17-431c-8c57-063eddf889ec',
        '115b3074-8467-4bbc-9efd-866e1550fbea',
        'e967f60e-3ada-40b9-9e7b-a0cdc01bf294',
        '66ad631a-1c03-4fd3-9796-1e2c72045f51',
        'c5cca1c4-a734-4f6e-9528-2fb73e8981d1',
        '070f87e2-7d71-4035-9cb8-92f8e68fddc7',
        '2b062094-76ee-4049-8486-e91e7364a36c',
        'd931e356-442a-4f21-817c-72ebeac2502d',
        'b06ef6cb-566d-49e2-94c3-108af3879cc4',
        '69f0c685-4881-41c1-8f80-44d62e27ab10',
        'f9ecc1b0-fbdc-4fe3-8eb4-869c67365af5',
        'eb6558b5-8967-4108-a7aa-2eee78cf7e11',
        'f4065cab-df7f-4fc2-a5e3-b448be76e3eb',
        '391c97d2-1d48-41de-89d6-10211382e250',
        'f6ba84af-cf1c-4668-8ecd-c0ea6f79ae31',
        'db16a2d5-d690-49f8-9a19-966e57b94272',
        '38b88ab7-e5d2-4ebd-b7dd-1a84d687527c',
        '3ef86c17-a93a-4d72-8902-4d1005a40809',
        'b50615da-efaa-4699-b35c-65029bfd9139',
        '705ca9de-3898-40c2-ad52-b4837e9f95da',
        '6bc8a78e-3e8e-4cf8-8b77-58cc55b3b04d',
        '2fc36249-1cf4-46d1-90e4-d511a57a5146',
        '9c4d495c-6963-4363-bbc3-093770e6d73a',
        '8d927954-056d-4dfe-8ff6-a2fa38502c29',
        'e551c74e-724e-4251-b156-1af9ad275188',
        'b7cd8e88-d7e9-4440-a7f2-cdb5f0b3de07',
        '320fc430-4fb7-4bf1-8f96-60941216a642',
        '46a8ac14-ab87-4ea1-821e-4227517f1799',
        '93807556-2ae8-48ea-90e9-bf1f570bee5a',
        '1d267354-3a71-4a2d-bec8-7914f1b530da',
        '18832a8e-2895-4428-98e6-1469e5d6d874',
        '99a48970-1794-437d-998f-4d9e76313b86',
        '9d6a3648-52b0-4592-b94f-a7b545d023a8',
        '65d8c11e-b830-4e2b-b50a-81a1a5b82813',
        '73453716-43b9-4786-896f-e3c35b39411d',
        '6c6a73c0-37b0-4f51-872f-5256e6d5e128',
        'c24e0f49-5f28-4099-bc42-f2a830256860',
        '22e70e30-b530-4228-b0a7-a979204018e6',
        '726059c6-8204-46c5-af41-c7c4b574a441',
        '41951f28-b183-49d9-95a2-972183c50059',
        'a076779a-1c71-460b-8d74-c3c2f10b78d2',
        '71e5446f-292d-4573-a3d9-a764d6e902b4',
        'b3a4f661-82e7-4404-b9b3-6c8c4a169b82',
        'a5b674d8-0435-4309-848e-f2d488e0e5a6',
        '1168f126-786d-4089-9a00-51c6b54b01ce',
        '540e1074-a690-4820-a750-f1c5034c49f8',
        '8f4088a8-0d17-4861-ba4a-7067885b5d13',
        'c248b6c4-b74a-4d2c-af87-f82343275727',
        '720b028c-0237-43c2-a447-79738d875080',
        'e14f08d5-1884-4054-940f-90e98083a228',
        '4e4f7112-9844-42b7-a369-637952e47e8b',
        '00a40d58-b648-43ec-8006-218a09f87c80',
        'c635d07c-9b62-4f11-82be-9252c1075727',
        '8f167389-136f-409b-a63e-f14d9b4b008d',
        '50d3c054-90a6-42d8-b57f-d102e3532c69',
        'c242e2b3-5798-44d4-9f20-80d4538805f9',
        '0c978b7a-8f5b-4394-a16f-117c45330a84',
        'c1c28c82-f0b3-4f9e-a868-b805822e1766',
        'd07c0303-a159-4503-9d89-9b4862f92b77',
        '096c4692-a1b4-4e47-9759-99411d99611e',
        'f86b72a4-5690-482d-8877-e21683260907',
        '1106e23c-f3c5-4428-9844-0c25a0937a06',
        '520021b3-6c8f-43b6-905e-a4b5d27845f0',
        '1a084c68-04f7-418c-8519-c63567d264f3',
        'a0f6805d-6b45-4277-bf31-507987e937d5',
        'a703d19d-7f71-419b-a010-85f269a7c649',
        '8f407519-2041-4820-a6a3-2612f7188b39',
        'f48b940e-749e-4a6c-9418-4226f90d4078',
        'd95e5095-88f5-4e78-ba6d-47c34b3e346f',
        '441a5476-879e-4e89-80b6-7e3f2081d582',
        '7268579f-68e7-49f3-80b6-39322c365319',
        'c476798c-8f23-4414-874e-4f3679c2a63d',
        '73010b42-7724-4f9e-b930-b3b3a3794689',
        '0269f884-601e-4513-81c8-89c0b1158a74',
        '3f3d7915-d72b-4228-b807-f9828e51b1f6',
        '4e19b674-8b63-44f6-8217-062e08677c7f',
        'e15b5608-466c-48c0-82a9-0639d675681b',
        'c56f8745-0d29-4176-b997-60a67123d917',
        'c169229c-d0b4-4e92-9653-56886e068c2b',
        '1f278d65-b778-4394-a90e-b2d9082269a8',
        '1168f126-786d-4089-9a00-51c6b54b01ce',
        '18832a8e-2895-4428-98e6-1469e5d6d874',
        '99a48970-1794-437d-998f-4d9e76313b86',
        '9d6a3648-52b0-4592-b94f-a7b545d023a8'
    ]::UUID[];
BEGIN
    -- 1. Detach users first (set outlet_id to NULL)
    UPDATE users 
    SET outlet_id = NULL 
    WHERE outlet_id = ANY(target_ids);

    -- 2. Delete transactions (linked via daily_records)
    DELETE FROM transactions 
    WHERE daily_record_id IN (
        SELECT id FROM daily_records WHERE outlet_id = ANY(target_ids)
    );

    -- 3. Delete daily_records
    DELETE FROM daily_records 
    WHERE outlet_id = ANY(target_ids);

    -- 4. Delete monthly_closure_snapshots
    DELETE FROM monthly_closure_snapshots 
    WHERE outlet_id = ANY(target_ids);

    -- 5. Delete monthly_closures
    DELETE FROM monthly_closures 
    WHERE outlet_id = ANY(target_ids);

    -- 6. Finally delete outlets
    DELETE FROM outlets 
    WHERE id = ANY(target_ids);
    
    RAISE NOTICE 'Deleted % outlets and related data', array_length(target_ids, 1);
END $$;
