# Installing Supabase CLI on Windows

The Supabase CLI cannot be installed via `npm install -g`. Use one of these methods instead:

## Method 1: Using Scoop (Recommended for Windows)

1. **Install Scoop** (if not already installed):
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
   ```

2. **Install Supabase CLI**:
   ```powershell
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase
   ```

3. **Verify installation**:
   ```powershell
   supabase --version
   ```

## Method 2: Direct Download (Binary)

1. **Download the latest release**:
   - Go to: https://github.com/supabase/cli/releases
   - Download `supabase_windows_amd64.zip` (or appropriate version for your system)

2. **Extract and add to PATH**:
   - Extract the zip file
   - Copy `supabase.exe` to a folder in your PATH (e.g., `C:\Program Files\Supabase\`)
   - Or add the extracted folder to your system PATH

3. **Verify installation**:
   ```powershell
   supabase --version
   ```

## Method 3: Using Chocolatey (If you have it)

```powershell
choco install supabase
```

## After Installation

Once installed, you can:

1. **Login to Supabase**:
   ```powershell
   supabase login
   ```

2. **Link to your project**:
   ```powershell
   supabase link --project-ref your-project-ref
   ```

3. **Run migrations**:
   ```powershell
   supabase db push
   ```

4. **Start local development**:
   ```powershell
   supabase start
   ```

## For Your RETROHUB Project

Since you're using Supabase for your e-commerce platform, the CLI will help you:

- **Manage database migrations**: Update your schema easily
- **Test locally**: Run Supabase locally for development
- **Manage functions**: Deploy and test database functions
- **Sync schema**: Pull/push database changes

## Note

You don't necessarily need the CLI to use Supabase - you can manage everything through the Supabase Dashboard web interface. The CLI is useful for:
- Local development
- Automated deployments
- Version control of database changes
- Advanced workflows

For basic usage, the Supabase Dashboard is sufficient!

---

**Dev by ABIR HOSSAIN**

